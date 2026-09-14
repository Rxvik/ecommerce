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
