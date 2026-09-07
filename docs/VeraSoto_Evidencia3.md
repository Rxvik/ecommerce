# Vera Soto Axel Rainier Evidencia 3

## Archivos creados pero sin codigo 
### product.controller.js
### product.repository.js
### product.routes.js
### product.schema.js
### product.service.js

## Codigo Escrito
### async-handler.js
``` JS
export function asyncHandler(handler) {
    return function wrapperHandler (
        req,
        res,
        next
    ) {
        Promise.resolve(
            handler(req, res, next)
        ).catch(next);
    }
}
```

### validate-middleware.js
``` JS
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

export function validate (schema) {
    return function ValidationMiddleware (
        req, _res, next
    ) {
        try {
            const result = schema.parse ({
                body: req.body,
                params: req.params,
                query: req.query
            })
            req.validated = result;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                new AppError({
                    statusCode: 400,
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation error',
                    details: error.issues
                })
            }
        }
    }
}
```

### error.middleware.js
```JS
import { logger } from '../../config/logger.js';
import { AppError } from '../errors/app-error.js';
import { env } from '../../config/env.js';

export function errorMiddleware(err, req, res, _next) {
    if (err instanceof AppError) {
        logger.warn({
            code: err.code,
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            details: err.details
        }, err.message);
        return res.status(err.statusCode)
            .json({
                success: false,
                error: {
                    code: err.code,
                    message: err.message,
                    ...(err.details ? { details: err.details } : {})
                },
                meta: {
                    requestId: req.id
                }
            });
    }

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
### app-error.js
``` JS
export class AppError extends Error {
    constructor({
        statusCode,
        code,
        message,
        details
    }) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
```

