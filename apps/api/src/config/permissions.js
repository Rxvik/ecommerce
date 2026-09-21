export const permissionsByRole = Object.freeze({
    CUSTOMER: new Set([
        'products:read',
        'orders:create',
        'orders:read-own', // Nota: también corregí 'read-down' por 'read-own' si era un typo
    ]),
    ADMIN: new Set([
        'products:read',
        'products:create',
        'products:update',
        'products:delete',
        'users:read',
        'orders:create',
        'orders:update',
    ]),
    SUPER_ADMIN: new Set([
        '*'
    ])
});
