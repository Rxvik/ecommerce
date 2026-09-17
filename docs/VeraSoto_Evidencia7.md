# EVIDENCIA 7 VERA SOTO

### permissions.js
``` JS
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
```

### authorize.middleware.js
``` JS
import { permissionsByRole } from '../../config/permissions.util.js';
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
```

### product.routes.js
``` JS
import { Router } from 'express'

import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct
} from './product.controller.js'

import {
  createProductSchema,
  deleteProductSchema,
  getProductSchema,
  listProductsSchema,
  updateProductSchema
} from './product.schema.js'

import { asyncHandler } from '../../shared/http/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'

const router = Router()

//Rutas Publicas
router.get(
  '/',
  validate(listProductsSchema),
  asyncHandler(listProducts)
)

router.get(
  '/:id',
  validate(getProductSchema),
  asyncHandler(getProduct)
)

//Rutas Administrativas
router.post(
  '/',
  authorize('products: create'),
  validate(createProductSchema),
  asyncHandler(createProduct)
)

router.patch(
  '/:id',
  authorize('products: update'),
  validate(updateProductSchema),
  asyncHandler(updateProduct)
)

router.delete(
  '/:id',
  authorize('products: delete'),
  validate(deleteProductSchema),
  asyncHandler(deleteProduct)
)

export default router
```

### promote-admin.js
``` JS
import {
  db
} from '../src/config/firebase.js'

const email =
  process.argv[2]

if (!email) {
  console.error(
    'Uso: node apps/api/scripts/promote-admin.js correo@dominio.com'
  )

  process.exit(1)
}

const snapshot =
  await db
    .collection('users')
    .where(
      'email',
      '==',
      email.toLowerCase()
    )
    .limit(1)
    .get()

if (snapshot.empty) {
  console.error(
    'Usuario no encontrado'
  )

  process.exit(1)
}

await snapshot.docs[0]
  .ref
  .update({
    role:
      'ADMIN'
  })

console.log(
  `Usuario ${email} promovido a ADMIN`
)

process.exit(0)
```

### firebase.js
``` JS
import {
  cert,
  getApps,
  initializeApp
} from 'firebase-admin/app'

import {
  getFirestore
} from 'firebase-admin/firestore'

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = process.env

if (
  !FIREBASE_PROJECT_ID ||
  !FIREBASE_CLIENT_EMAIL ||
  !FIREBASE_PRIVATE_KEY
) {
  throw new Error(
    'Firebase environment variables are missing'
  )
}

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      })

export const db = getFirestore(firebaseApp)
```
