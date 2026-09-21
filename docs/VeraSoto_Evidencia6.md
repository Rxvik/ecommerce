# Vera Soto Evidencia 6

## Codigos Creados o modificados

### index.js
``` JS
import { Router } from 'express'
import healthRoutes from '../modules/health/health.routes.js'
import productRoutes from '../modules/products/product.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import userRoutes from '../modules/users/user.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/products', productRoutes)

export default router
```
### user.routes.js
``` JS 
import { Router } from 'express';
import { me } from './user.controller.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import  {authenticate} from '../../shared/middleware/authenticate.middleware.js';

const router = Router()

router.get('/me', authenticate, asyncHandler(me))

export default router
```
### user.controller.js
``` JS
import { AppError } from '../../shared/errors/app-error.js';
import * as userRepository from './user.repository.js';

export async function me (req, res) {
    const user = await userRepository.findById(req.auth.userId);
    if (!user) {
        throw new AppError({
            statusCode: 404,
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado'
        })
    }

    return res.status(200).json({
        success: true,
        data: user,
        meta: {
            requestId: req.id
        }
    })
}
```
### authenticate.middleware.js
``` JS
import { AppError } from '../errors/app-error.js';
import { verifyAccessToken } from '../security/tokens.js';

export function authenticate (req, _res, next) {
    const authorization =  req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new AppError({
            statusCode: 401,
            code: 'AUTH_REQUIRED',
            message: 'Autenticación requerida'
        })
    }

    const token = authorization.slice(7);
    try {
        const payload = verifyAccessToken(token);
        req.auth = {
            userId: payload.sub,
            role: payload.role
        }
        return next();
    } catch {
        return next(
            new AppError({
                statusCode: 401,
                code: 'INVALID_ACCESS_TOKEN',
                message: 'Token de acceso inválido'
            })
        )
    }

}
```
### auth.routes.js
``` JS
import { Router } from 'express'
import { login, refresh, register } from './auth.controller.js'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'

const router = Router()

router.post('/register', validate(registerSchema), asyncHandler(register))
router.post('/login', validate(loginSchema), asyncHandler(login))
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh))

export default router
```
### auth.controller.js
``` JS
import * as authService from './auth.service.js'

export async function register (req, res) {
    const data =await authService.register(req.validated.body);

    return res.status(201).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function login (req, res) {
    const data = await authService.login(req.validated.body);

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function refresh (req, res) {
    const data = await authService.refresh(req.validated.body.refreshToken);

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}
```
### user.repository.js
``` JS
import { FieldValue} from 'firebase-admin/firestore';
import { db } from "../../config/firebase.js";

const usersCollection = db.collection('users');

function mapTimestamp(value) {
    return value?.toDate?.()?.toISOString() ?? null
}

function mapUser (document) {
    if (!document.exists) {
        return null;
    }

    const data = document.data();

    return {
        id: document.id,
        email: data.email,
        name: data.name,
        role: data.role,
        active: data.active,
        createdAt: mapTimestamp(data.createdAt),
        updatedAt: mapTimestamp(data.updatedAt)
    }
}

export async function createUser(data) {
    const user = usersCollection.doc();
    await user.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    })
    const created = await user.get();
    return mapUser(created);
}

export async function findById(id) {
    const doc = await usersCollection.doc(id).get();
    return mapUser(doc);
}

export async function findByEmail(email) {
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        return null;
    }

    const foundUser = snapshot.docs[0];
    return {
        ...mapUser(foundUser),
        passwordHash: foundUser.data().passwordHash
    }
}
```
### auth.service,js
``` JS
import { AppError } from '../../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../shared/security/password.js';
import { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from '../../shared/security/tokens.js';
import * as userRepository from '../users/user.repository.js';
import * as authRepository from './auth.repository.js';

function issueTokens (user) {
    const payload = {
        sub: user.id,
        role: user.role
    }
    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload)
    }
}

export async function register (data) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
        throw new AppError({
            statusCode: 409,
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'email already exists'
        })
    }
    const user = await userRepository.createUser({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: 'user',
        active: true
    });
    const tokens = issueTokens(user);
    await authRepository.saveRefreshToken({
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken)
    });
    return {
        user,
        ...tokens
    }
}

export async function login (data) {
    const user = await userRepository.findByEmail(data.email);

    if (!user) {
        throw new AppError({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas'
        })
    }

    const validPassword = await verifyPassword(data.password, user.passwordHash);

    if (!validPassword || !user.active) {
        throw new AppError({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas'
        })
    }

    const tokens = issueTokens(user);

    await authRepository.saveRefreshToken({
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken)
    })

    return {
        user,
        ...tokens
    }
}

export async function refresh (refreshToken) {
    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError({
            statusCode: 401,
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token inválido'
        })
    }
    const tokenHash = hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);
    if (!storedToken || storedToken.revoked || storedToken.userId !== payload.sub) {
        throw new AppError({
            statusCode: 401,
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token inválido'
        })
    }

    await authRepository.revokeRefreshToken(tokenHash);
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.active) {
        throw new AppError({
            statusCode: 401,
            code: 'USER_DISABLED',
            message: 'Usuario no disponible'
        })
    }

    const tokens = issueTokens(user);
    await authRepository.saveRefreshToken({
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken)
    })

    return tokens;
}
```
