# Evidencia 1

## Comandos de consola 
``` bash
    git remote -v
    git remote remove origin
    git remote add origin https://github.com/VeraSoto/nodejs-monorepo.git
    npm init -y
    npm init -w apps/api -y 
    npm init -w packages/contracts -y
    npm init -w packages/config -y 
    npm init -w packages/shared -y
    npm i express dotenv cors helmet pino pino-http --workspace=@ecommerce/api
    npm i -D nodemon eslint @eslint/js globals pino-pretty --workspace=@ecommerce/api
```

## Archivos y codigo creados 
### apps/api/src/config/env.js
``` JS
apps/api/src/config/env.js
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const envFile = path.resolve(currentDirectory, '../../.env');

dotenv.config ({
    path: envPath
})

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe de ser vallido');
} 

export const env = Object.freeze({
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    API_PREFIX: process.env.API_PREFIX,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    LOG_LEVEL: process.env.LOG_LEVEL
});
```
### apps/api/src/config/logger.js
``` JS
import pino from 'pino';
import {env} from './env.js';

const transport =
    env.NODE_ENV === 'production' ? undefined : pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standart',
            ignore: 'pid,hostname'
        }
    });

    export const logger = pino({
        level: env.LOG_LEVEL,
    }, transport);
```

### apps/api/src/modules/health/health.controller.js
``` JS
import { env } from '../../config/env.js';

export function getHealth(req, res) {
    return res.status(200).json({
        success: true,
        data : {
            service: 'ecommerce-api',
            status: 'ok',
            enviroment: env.NODE_ENV,
            uptime: Number(process.uptime()).toFixed(2),
            timestamp: new Date().toISOString()
        },
        meta: {
            requestId: req.id
        }
    });
}
```

### apps/api/src/modules/health/health.routes.js
``` JS
import { Router } from 'express';
import { getHealth } from './health.controller.js';

const healthRoutes = Router();

healthRoutes.get('/', getHealth);

export default healthRoutes;
```

### apps/api/src/routes/index.js
``` JS
import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.controller.js';

const router = Router();

router.get('/', healthRoutes);

export default router;
```

### apps/api/src/shared/middleware/error.middleware.js
``` JS
import { logger } from '../../config/logger.js';

export function errorMiddleware(err, req, res, _next) {
    logger.error({
        err,
        request: req.id,
        message: err.message,
        method: req.method,
        url: req.originalurl,
    }, 'Unhandled application error');

    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
        },
        meta: {
            requestId: req.id
        }
    });
}    
```

### apps/api/src/shared/middleware/not-found.middleware.js
``` JS
export function notFoundMiddleware(req, res) {
    return res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.originalurl} not found`
        },
        meta: {
            requestId: req.id
        }
    });
}
```
