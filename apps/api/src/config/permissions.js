export const permissionsByRole = {
    Object.freeze({
        CUSTOMER: new Set([
            'products:read',
            'orders:create',
            'orders:read-down',
        ]),
        ADMIN: new Set([
            'products:read',
            'products: create',
            'products: update',
            'products: delete',
            'users:read',
            'orders:create',
            'orders:update',
        ]),
        SUPER_ADMIN: new Set([
            '*'
        ])
    })
}
