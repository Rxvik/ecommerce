#Evidencia 2

## Comandos de consola
``` bash
    npm run lint
    npm run dev
```

## Archivos y codigo creados
## .editorconfig
``` editor
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 4
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```
## .evmrc
``` 
24
```
## .gitignore
```
node_modules/
.env 

*.log
logs/

coverage/

dist/   
build/
```
## eslint.config.js
``` JS
import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: [
            'node_modules/**',
            'coverage/**',
        ]
    },
    js.configs.recommended,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            }
        },
        rules: {
            'no-unused-vars': [
                'error', {
                    argsIgnorePattern: '^_',
                }
            ]
        }
    }
]
```
## server.js
``` JS
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
```
## index.js
``` JS
import  { Router }  from 'express';
import  healthRoutes  from '../modules/health/health.routes.js';

const router = Router();

router.use('/', healthRoutes);

export default router;
```
## health.routes.js
``` JS
import { Router } from 'express';
import { getHealth } from './health.controller.js';

const router = Router();

router.get('/', getHealth);

export default router;
```

