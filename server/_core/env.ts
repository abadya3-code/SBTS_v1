export const ENV = {
  appId: process.env.VITE_APP_ID ?? "sbts-local",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

const MIN_SECRET_LENGTH = 32;

export function validateEnv(): void {
  const errors: string[] = [];

  if (ENV.isProduction && !ENV.databaseUrl) {
    errors.push("DATABASE_URL is required in production.");
  }

  if (ENV.isProduction && ENV.cookieSecret.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`);
  }

  if (errors.length > 0) {
    throw new Error(`[ENV] Invalid configuration:\n- ${errors.join("\n- ")}`);
  }

  if (!ENV.isProduction && ENV.cookieSecret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `[ENV] JWT_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. ` +
      "Development mode will run, but production startup will fail until this is fixed."
    );
  }

  if (!ENV.databaseUrl) {
    console.warn("[ENV] DATABASE_URL is not set. Database-backed features will fail until configured.");
  }
}

export function getJwtSecret(): string {
  if (ENV.cookieSecret.length >= MIN_SECRET_LENGTH) return ENV.cookieSecret;
  if (!ENV.isProduction) return "sbts-development-only-secret-change-before-production";
  throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
}
