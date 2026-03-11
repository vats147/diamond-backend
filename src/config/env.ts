import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().url().optional().default("redis://localhost:6379"),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("24h"),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  FRONTEND_URL: z.string().default("*"),
  // Base URL used to generate shareable diamond links in storefront responses & downloads
  // e.g. https://yourapp.com  →  links become https://yourapp.com/{slug}/diamonds/{id}
  // Falls back to first value of FRONTEND_URL when not set.
  STORE_BASE_URL: z.string().optional(),
  // Optional
  GIA_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
