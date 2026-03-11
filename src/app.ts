import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";

import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";
import diamondRoutes from "./modules/diamond/diamond.routes";
import inquiryRoutes from "./modules/inquiry/inquiry.routes";
import storeRoutes from "./modules/store/store.routes";
import adminRoutes from "./modules/admin/admin.routes";
import developerRoutes from "./modules/developer/developer.routes";
import externalRoutes from "./modules/external/external.routes";
import metadataRoutes from "./modules/metadata/metadata.routes";

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────────────────

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // No origin header = curl / Postman / mobile apps → always allow
    if (!origin) return callback(null, true);

    // Development: allow every origin without restriction
    if (env.NODE_ENV === "development") return callback(null, true);

    // Any localhost / 127.0.0.1 / 192.168.x.x on any port (staging / LAN testing)
    if (
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
        origin,
      )
    ) {
      return callback(null, true);
    }

    // Wildcard configured → allow all
    if (env.FRONTEND_URL === "*") return callback(null, true);

    // Production: match against comma-separated FRONTEND_URL whitelist
    const allowed = env.FRONTEND_URL.split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);

    // Rejected – return a plain error string so cors sets the right status
    callback(new Error(`CORS policy: origin "${origin}" is not allowed`));
  },

  credentials: true,

  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "X-Requested-With",
    "Accept",
  ],

  // Expose Content-Disposition so browsers can read download filenames
  exposedHeaders: ["Content-Disposition"],

  // Cache preflight response for 10 minutes
  maxAge: 600,
};



// Apply CORS headers to all subsequent requests
app.use(cors(corsOptions));

// ─────────────────────────────────────────────────────────────────────────────
// BODY PARSERS
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST LOGGER
// ─────────────────────────────────────────────────────────────────────────────

app.use(requestLogger);

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Diamond Market API is running",
    timestamp: new Date(),
    env: env.NODE_ENV,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n\n🚀 [DEBUG] STARTING ROUTE MOUNTING...\n\n");

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/diamonds", diamondRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/v1", externalRoutes);
app.use("/api/metadata", metadataRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
