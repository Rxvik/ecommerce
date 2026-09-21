import { permissionsByRole } from '../../config/permissions.js';
import { AppError } from '../errors/app-error.js';

export function authorize(permission) {
    return function authorizationMIddleware(req, _res, next) {
        const role = req.auth?.role;
        const permissions = permissionsByRole[role];
        if (!permissions || (!permissions.has(permission) && !permissions.has('*'))) {
            return next(new AppError({
                statusCode: 403,
                code: 'FORBIDDEN',
                message: 'No tienes permisos wei'
            }))
        }
    return next();
    }

}
