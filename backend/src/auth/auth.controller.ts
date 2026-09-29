import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ConfirmPasswordChangeDto } from './dto/change-password.dto';
import { RequestEmailChangeDto, ConfirmEmailChangeDto } from './dto/change-email.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Admin accounts are provisioned by an existing Super Admin, not
  // self-service — this endpoint is Super-Admin-only.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  // Self-service display info only (name/phone/bio/photo) — email,
  // password and role all go through their own dedicated flows above.
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@CurrentUser() user: { id: string }) {
    return this.authService.setupMfa(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/confirm')
  confirmMfa(@CurrentUser() user: { id: string }, @Body() dto: VerifyMfaDto) {
    return this.authService.confirmMfa(user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  disableMfa(@CurrentUser() user: { id: string }) {
    return this.authService.disableMfa(user.id);
  }

  // --- Forgot Password (logged-out) — both routes always return the same
  // shape regardless of whether the email has an account (see
  // AuthService.requestPasswordReset), so keep it that way in the
  // controller too: no separate error branch for "unknown email".

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  // --- Change Password (OTP-verified, Security page) ---

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password/request-otp')
  requestPasswordChangeOtp(@CurrentUser() user: { id: string }) {
    return this.authService.requestPasswordChangeOtp(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password/confirm')
  confirmPasswordChange(@CurrentUser() user: { id: string }, @Body() dto: ConfirmPasswordChangeDto) {
    return this.authService.confirmPasswordChange(user.id, dto.otp, dto.newPassword);
  }

  // --- Change Email (OTP-verified, Security page) ---

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-email/request-otp')
  requestEmailChangeOtp(@CurrentUser() user: { id: string }, @Body() dto: RequestEmailChangeDto) {
    return this.authService.requestEmailChangeOtp(user.id, dto.newEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-email/confirm')
  confirmEmailChange(@CurrentUser() user: { id: string }, @Body() dto: ConfirmEmailChangeDto) {
    return this.authService.confirmEmailChange(user.id, dto.otp);
  }
}
