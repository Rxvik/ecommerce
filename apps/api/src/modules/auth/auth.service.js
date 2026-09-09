import { AppError } from '../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../shared/security/passwords.js';
import { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from '../shared/security/tokens.js';
import * as uiserRepository from '../users/user.repository.js';
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
    const existingUser = await uiserRepository.findByEmail(data.email);
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
