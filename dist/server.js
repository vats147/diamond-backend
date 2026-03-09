"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const db_1 = __importDefault(require("./config/db"));
const PORT = parseInt(env_1.env.PORT, 10);
const startServer = async () => {
    try {
        await db_1.default.$connect();
        const server = app_1.default.listen(PORT, () => {
            console.log('\n============================================');
            console.log('     DIAMOND MARKET API                     ');
            console.log('============================================');
            console.log(`Server running on port : ${PORT}`);
            console.log(`Environment           : ${env_1.env.NODE_ENV}`);
            console.log(`Base URL              : http://localhost:${PORT}/api`);
            console.log(`Health check          : http://localhost:${PORT}/health`);
            console.log('--------------------------------------------');
            console.log('Request logs are saved to the database (RequestLog collection)\n');
        });
        const shutdown = async (signal) => {
            console.log(`\n${signal} received - shutting down gracefully...`);
            server.close(async () => {
                await db_1.default.$disconnect();
                console.log('DB disconnected. Bye!');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled Promise Rejection:', reason);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        await db_1.default.$disconnect();
        process.exit(1);
    }
};
startServer();
