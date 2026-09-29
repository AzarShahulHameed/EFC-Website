import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Fires after any successful POST/PATCH/PUT/DELETE made by an authenticated
// user, and writes a row to AuditLog. Best-effort and fire-and-forget: a
// logging failure must never fail the request it's describing.
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, params, body } = request;

    if (!WRITE_METHODS.has(method) || !user?.id) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody: any) => {
        // This whole block is best-effort logging bolted onto a request that
        // has ALREADY succeeded — a bug here must never surface as a failure
        // to the person who just saved something. Previously safeMetadata()
        // could throw synchronously (see below), and because that throw
        // happened inside `tap`, RxJS turned it into a pipeline error, which
        // NestJS then reported to the client as a 500 — even though the real
        // write (e.g. the team member PATCH) had already completed. Wrapping
        // the whole thing in try/catch keeps any logging failure confined to
        // a warning in this terminal, exactly like the .catch() below already
        // does for a failed database write.
        try {
          const entityType = url.split('?')[0].split('/').filter(Boolean)[0] ?? 'unknown';
          const entityId = responseBody?.id ?? params?.id ?? 'n/a';

          this.prisma.auditLog
            .create({
              data: {
                userId: user.id,
                action: method,
                entityType,
                entityId: String(entityId),
                metadata: safeMetadata(body),
              },
            })
            .catch((err) => this.logger.warn(`Failed to write audit log: ${err.message}`));
        } catch (err) {
          this.logger.warn(`Failed to build audit log metadata: ${(err as Error).message}`);
        }
      }),
    );
  }
}

// Keeps the metadata small and strips anything resembling a secret.
//
// This used to do `JSON.parse(JSON.stringify(clone).slice(0, 4000))` to cap
// the size — but slicing a JSON string at a fixed character count has no
// idea where a string value ends, so on any request whose body serialized
// to more than 4000 characters (e.g. a team member's rich-text bio, or a
// long service description), the cut landed *inside* a string and produced
// invalid JSON ("Unterminated string in JSON at position 4000"), which
// JSON.parse then threw on. Truncating each field's own value instead of
// the serialized text can never split a string mid-escape-sequence, so the
// result is always valid JSON.
const MAX_FIELD_LENGTH = 2000;
const MAX_TOTAL_LENGTH = 4000;

function safeMetadata(body: unknown): Prisma.InputJsonValue | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (/password|secret|token|otp|code/i.test(key)) {
      delete clone[key];
      continue;
    }
    const value = clone[key];
    if (typeof value === 'string' && value.length > MAX_FIELD_LENGTH) {
      clone[key] = `${value.slice(0, MAX_FIELD_LENGTH)}… (truncated, ${value.length} chars total)`;
    }
  }
  // Belt-and-braces: even after per-field truncation, cap the overall size
  // (e.g. many small fields, or a large nested array/object) without ever
  // re-parsing a truncated string as JSON.
  const serialized = JSON.stringify(clone);
  // This is only ever headed to a Prisma `Json?` column, which accepts any
  // JSON-serializable value at runtime; `clone`'s field values start out as
  // `unknown` (straight off the request body) purely so nothing upstream of
  // this function can assume its shape, so the cast below is just telling
  // TypeScript what we already guarantee by construction (every value here
  // came from JSON.parse of a real request body, or is a string we built
  // ourselves), not bypassing a real runtime check.
  if (serialized.length <= MAX_TOTAL_LENGTH) return clone as unknown as Prisma.InputJsonValue;
  return { truncated: true, preview: `${serialized.slice(0, MAX_TOTAL_LENGTH)}…` };
}
