import app from './app';
import { env } from './config/env';
import prisma from './config/db';

const PORT = parseInt(env.PORT, 10);

const startServer = async () => {
    try {
        await prisma.$connect();

        const server = app.listen(PORT, () => {
            console.log('\n============================================');
            console.log('     DIAMOND MARKET API                     ');
            console.log('============================================');
            console.log(`Server running on port : ${PORT}`);
            console.log(`Environment           : ${env.NODE_ENV}`);
            console.log(`Base URL              : http://localhost:${PORT}/api`);
            console.log(`Health check          : http://localhost:${PORT}/health`);
            console.log('--------------------------------------------');
            console.log('Request logs are saved to the database (RequestLog collection)\n');
        });

        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received - shutting down gracefully...`);
            server.close(async () => {
                await prisma.$disconnect();
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

    } catch (err) {
        console.error('Failed to start server:', err);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();
