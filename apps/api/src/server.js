import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
    logger.info({
        port: env.PORT,
        environment: env.NODE_ENV,
    }, `Proyecto NodeJS running 🚀: ${env.NODE_ENV}`);
});

let shuttingDown = false;

function shutdown(signal) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    logger.info({
        signal
    }, `Inicia proceso de apagado`);

    server.close((error) => {
        if (error) {
            logger.error({
                err:error
            }, `Error cuando se apagaba el servidor`);
            process.exit(1);
        }
        logger.info(`Servidor HTTP cerrado`);
        process.exit(0);
    });

    setTimeout(() => {
        logger.error(`Forzando a apagar despues de cierto tiempo`);
        process.exit(1);
    },10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
