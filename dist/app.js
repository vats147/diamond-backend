"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const logger_middleware_1 = require("./middleware/logger.middleware");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const business_routes_1 = __importDefault(require("./modules/business/business.routes"));
const diamond_routes_1 = __importDefault(require("./modules/diamond/diamond.routes"));
const inquiry_routes_1 = __importDefault(require("./modules/inquiry/inquiry.routes"));
const store_routes_1 = __importDefault(require("./modules/store/store.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const developer_routes_1 = __importDefault(require("./modules/developer/developer.routes"));
const external_routes_1 = __importDefault(require("./modules/external/external.routes"));
const metadata_routes_1 = __importDefault(require("./modules/metadata/metadata.routes"));
const app = (0, express_1.default)();
// CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin)
            return callback(null, true);
        // Allow all local network standard IPs (192.168.*.* or localhost)
        if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Check against FRONTEND_URL if set
        const allowedOrigins = env_1.env.FRONTEND_URL === '*' ? ['*'] : env_1.env.FRONTEND_URL.split(',');
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Body parsers
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logger (console + DB)
app.use(logger_middleware_1.requestLogger);
// Health check
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Diamond Market API is running', timestamp: new Date() });
});
// Routes
console.log('\n\n🚀 [DEBUG] STARTING ROUTE MOUNTING...\n\n');
app.use('/api/auth', auth_routes_1.default);
// Direct Route for Slug Check (Bypass router for debugging 404)
app.get('/api/businesses/check-slug/:slug', (req, res, next) => {
    console.log('🎯 [DEBUG] Hit direct check-slug route in app.ts for slug:', req.params.slug);
    const businessController = require('./modules/business/business.controller');
    return businessController.checkSlugAvailability(req, res, next);
});
app.use('/api/businesses', business_routes_1.default);
app.use('/api/diamonds', diamond_routes_1.default);
app.use('/api/inquiries', inquiry_routes_1.default);
app.use('/api/store', store_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/developer', developer_routes_1.default);
// Public Developer API
app.use('/api/v1', external_routes_1.default);
app.use('/api/metadata', metadata_routes_1.default);
// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Global Error Handler
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
