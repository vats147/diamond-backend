import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

import authRoutes from './modules/auth/auth.routes';
import businessRoutes from './modules/business/business.routes';
import diamondRoutes from './modules/diamond/diamond.routes';
import inquiryRoutes from './modules/inquiry/inquiry.routes';
import storeRoutes from './modules/store/store.routes';
import adminRoutes from './modules/admin/admin.routes';
import developerRoutes from './modules/developer/developer.routes';
import externalRoutes from './modules/external/external.routes';

const app = express();

// CORS
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);

        // Allow all local network standard IPs (192.168.*.* or localhost)
        if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }

        // Check against FRONTEND_URL if set
        const allowedOrigins = env.FRONTEND_URL === '*' ? ['*'] : env.FRONTEND_URL.split(',');
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger (console + DB)
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Diamond Market API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/diamonds', diamondRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/developer', developerRoutes);

// Public Developer API
app.use('/api/v1', externalRoutes);

// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
