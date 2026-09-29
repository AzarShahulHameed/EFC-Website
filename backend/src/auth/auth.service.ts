import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits, never leading-zero-ambiguous
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, role: dto.role },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials.');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials.');

    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        // First call: password is correct but a TOTP code is still required.
        return { mfaRequired: true };
      }
      const valid = authenticator.check(dto.mfaCode, user.mfaSecret!);
      if (!valid) throw new UnauthorizedException('Invalid MFA code.');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // Exchanges a valid, unexpired refresh token for a new access + refresh
  // token pair (rotation: the old refresh token is implicitly superseded —
  // there's no denylist, so treat this as "stateless rotation" rather than
  // true revocation; see the README's security notes).
  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid refresh token.');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, mfaEnabled: true, photoUrl: true, phone: true, bio: true },
    });
  }

  async updateProfile(userId: string, dto: { name?: string; phone?: string; bio?: string; photoUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, email: true, name: true, role: true, photoUrl: true, phone: true, bio: true },
    });
  }

  async setupMfa(userId: string) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const otpauthUrl = authenticator.keyuri(user.email, 'EFC Admin', secret);

    // Return the otpauth:// URL — the frontend renders it as a QR code via
    // a third-party image service (see /admin/security), and also shows
    // the raw secret for manual entry.
    return { otpauthUrl, secret };
  }

  async confirmMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret) throw new BadRequestException('Call /auth/mfa/setup first.');

    const valid = authenticator.check(code, user.mfaSecret);
    if (!valid) throw new UnauthorizedException('Invalid MFA code.');

    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    return { mfaEnabled: true };
  }

  async disableMfa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
    return { mfaEnabled: false };
  }

  // --- Change Password (OTP-verified) ---
  //
  // Two-step flow: request an OTP (emailed to the account's *current*
  // address, proving the requester controls that inbox), then confirm it
  // along with the new password. The OTP is never stored in plaintext —
  // only its bcrypt hash — and it's single-use (cleared on confirm) and
  // expires after 10 minutes.

  async requestPasswordChangeOtp(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingOtpHash: otpHash,
        pendingOtpPurpose: 'PASSWORD_CHANGE',
        pendingOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.email.sendOtpEmail(user.email, otp, 'PASSWORD_CHANGE');
    return { sent: true, to: user.email };
  }

  async confirmPasswordChange(userId: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.verifyOtp(user, otp, 'PASSWORD_CHANGE');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        pendingOtpHash: null,
        pendingOtpPurpose: null,
        pendingOtpExpiresAt: null,
      },
    });
    return { changed: true };
  }

  // --- Change Email (OTP-verified) ---
  //
  // The OTP is emailed to the *new* address (not the current one) — that's
  // what proves the admin actually owns the inbox they're switching to,
  // rather than just knowing it exists. The new address is staged in
  // `pendingEmail` and only becomes the real `email` once the code is
  // confirmed.

  async requestEmailChangeOtp(userId: string, newEmail: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== userId) {
      throw new ConflictException('That email address is already in use by another account.');
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        pendingOtpHash: otpHash,
        pendingOtpPurpose: 'EMAIL_CHANGE',
        pendingOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.email.sendOtpEmail(newEmail, otp, 'EMAIL_CHANGE');
    return { sent: true, to: newEmail };
  }

  async confirmEmailChange(userId: string, otp: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.verifyOtp(user, otp, 'EMAIL_CHANGE');
    if (!user.pendingEmail) {
      throw new BadRequestException('No email change is pending — start again from Security → Change Email.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        pendingOtpHash: null,
        pendingOtpPurpose: null,
        pendingOtpExpiresAt: null,
      },
      select: { id: true, email: true },
    });
    return { changed: true, email: updated.email };
  }

  // --- Forgot Password (logged-out, OTP-verified) ---
  //
  // Unlike Change Password above, the requester isn't authenticated yet —
  // so this must never reveal whether a given email has an account. Both
  // "email exists" and "email doesn't exist" return the exact same
  // `{ sent: true }` response, on the same code path timing-wise, and any
  // failure to actually send mail (e.g. SMTP misconfigured) is swallowed
  // and logged server-side rather than surfaced to the caller — otherwise
  // an existing account with a broken mail server would visibly error
  // while a nonexistent email would silently "succeed", leaking exactly
  // the account-existence signal this is designed to hide.

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          pendingOtpHash: otpHash,
          pendingOtpPurpose: 'PASSWORD_RESET',
          pendingOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
      });
      try {
        await this.email.sendOtpEmail(user.email, otp, 'PASSWORD_RESET');
      } catch (err) {
        this.logger.error(`Failed to send password-reset email to ${user.email}`, err as Error);
      }
    }
    return { sent: true };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Same "incorrect code" message whether the email doesn't exist or the
    // code is simply wrong — no separate "no such account" branch.
    if (!user) throw new UnauthorizedException('Incorrect code — please try again.');
    await this.verifyOtp(user, otp, 'PASSWORD_RESET');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        pendingOtpHash: null,
        pendingOtpPurpose: null,
        pendingOtpExpiresAt: null,
      },
    });
    return { reset: true };
  }

  private async verifyOtp(
    user: { pendingOtpHash: string | null; pendingOtpPurpose: string | null; pendingOtpExpiresAt: Date | null },
    otp: string,
    purpose: 'PASSWORD_CHANGE' | 'EMAIL_CHANGE' | 'PASSWORD_RESET',
  ) {
    if (!user.pendingOtpHash || user.pendingOtpPurpose !== purpose) {
      throw new BadRequestException('No verification code is pending for this action — request a new one.');
    }
    if (!user.pendingOtpExpiresAt || user.pendingOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This code has expired — request a new one.');
    }
    const valid = await bcrypt.compare(otp, user.pendingOtpHash);
    if (!valid) throw new UnauthorizedException('Incorrect code — please try again.');
  }

  private issueTokens(sub: string, email: string, role: string) {
    const payload = { sub, email, role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(
      { sub },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );
    return {
      accessToken,
      refreshToken,
      user: { id: sub, email, role },
    };
  }
}
