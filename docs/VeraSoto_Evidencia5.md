# Vera Soto Evidencia 5

## Codigos Creados

### auth.js
``` JS
import { env } from './env.js';

if (!env.JWT_ACCESS_SECRET) {
    throw new Error('JWT ACCESS SECRET es requerido')
}

if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT REFRESH SECRET es requerido')
}

export const authConfig = Object.freeze({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
})
```

### password.js
``` JS
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}
```
### env.js
``` JS
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const envPath = path.resolve(currentDirectory, '../../.env');


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
    LOG_LEVEL: process.env.LOG_LEVEL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN
});

if (!env.FIREBASE_PROJECT_ID) {
    throw new Error('Falta la variable de entorno FIREBASE_PROJECT_ID');
}
```
### tokens.js
``` JS
import { createHash} from 'node:crypto';
import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.js';

export function signAccessToken(payload) {
    return jwt.sign(payload, authConfig.accessSecret, {
        expiresIn: authConfig.accessExpiresIn
    });
}

export function signRefreshToken(payload) {
    return jwt.sign(payload, authConfig.refreshSecret, {
        expiresIn: authConfig.refreshExpiresIn
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, authConfig.accessSecret);
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, authConfig.refreshSecret);
}

export function hashToken (token) {
    return createHash('sha256').update(token).digest('hex');
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
    const user = await usersCollection.where('email', '==', email).limit(1).get();

    if (user.empty) {
        return null;
    }

    const foundUser = user[0];
    return {
        ...mapUser(foundUser),
        passwordHash: foundUser.data().passwordHash
    }
}
```
### auth.schema.js
``` JS
import { z } from 'zod';

const empty = z.object({}).default({});
const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8).max(100);

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        email,
        password
    }),
    params: empty,
    query: empty
});

export const loginSchema = z.object({
    body: z.object({
        email,
        password
    }),
    params: empty,
    query: empty
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1)
    }),
    params: empty,
    query: empty
});
```
### auth.repository.js
``` JS
import { FieldValue } from 'firebase-admin/firestore';
import { db } from "../../config/firebase.js";

const refreshTokensCollection = db.collection('refreshTokens');

export async function saveRefreshToken({
    userId,
    tokenHash
}) {
    await refreshTokensCollection.doc(tokenHash)
    .set({
        userId,
        revoked: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
}

export async function findRefreshToken(tokenHash) {
    const token = await refreshTokensCollection.doc(tokenHash).get();
    if (!token.exists) {
        return null;
    }
    return {
        id: token.id,
        ...token.data()
    }
}

export async function revokeRefreshToken(tokenHash) {
    await refreshTokensCollection.doc(tokenHash)
    .set({
        revoked: true,
        revoketAt: FieldValue.serverTimestamp()
    }, {
        merge: true
    });
}
```
### auth.service.js
``` JS
import { AppError } from '../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../shared/security/passwords.js';
import { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from '../shared/security/tokens.js';
import * as uerRepository from '../users/user.repository.js';
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
    const user = userRepository.createUser({
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
```
