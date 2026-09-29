import { IsObject, registerDecorator, ValidationOptions } from 'class-validator';

// Admin-only, but still worth capping — the Theme Builder posts a free-form
// token tree and there's no schema to validate against, so this just
// guards against an accidentally (or maliciously) oversized payload.
function MaxJsonSize(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return `tokens payload is too large (max ${maxBytes} bytes)`;
        },
      },
    });
  };
}

export class UpdateThemeDto {
  // Free-form so the Theme Builder can add a new token (border radius,
  // hover effect, dark-mode variant, ...) without a migration:
  // { primaryColor, secondaryColor, accentColor, backgroundColor,
  //   typography: { headingFont, bodyFont }, buttonStyle, cardStyle,
  //   borderRadius, menuStyle, light: {...}, dark: {...} }
  @IsObject()
  @MaxJsonSize(100_000, { message: 'tokens payload is too large.' })
  tokens: Record<string, unknown>;
}
