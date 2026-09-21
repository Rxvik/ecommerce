# Evidencia 8 Vera Soto

### category.schema.js
``` JS
import { z } from 'zod';

const empty = z.object({}).default({});

const params = z.object({
  id: z.string().trim().min(1),
});

const categoryBody = z.object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+$/),
    active: z.boolean().default(true)
});

export const listCategoriesSchema = z.object({
    body: empty,
    query: empty,
    params: empty
});

export const getCategorySchema = z.object({
    body: empty,
    query: empty,
    params: empty
});

export const createCategoriesSchema = z.object({
    body: categoryBody,
    query: empty,
    params: empty
});

export const updateCategorySchema = z.object({
    body: categoryBody.partial().refine(value => Object.keys(value).length > 0, {
        message: "Esrequerido minimo un campo"
    }),
    query: empty,
    params: params
});

export const deleteCategorySchema = z.object({
    body: empty,
    query: empty,
    params
});
```

### category,repository.js
``` JS
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../config/firebase.js'

const categoriesCollection = db.collection('categories');

function mapTimestamp(value) {
  return value?.toDate?.()?.toISOString() ?? null
}

function mapCategory(document) {
  if (!document.exists) {
    return null
  }

  const data = document.data()

  return {
    id: document.id,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt)
  }
}

export async function listCategories() {
    const categories = await categoriesCollection.orderBy('name').get()
    return categories.docs.map(mapCategory)
}

export async function findCategoryById(id) {
    const category = await categoriesCollection.doc(id).get()
    return mapCategory(category)
}

export async function findCategoryBySlug(slug) {
    const category = await categoriesCollection.where('slug', '==', slug).limit(1).get()
    return category.empty ? null : mapCategory(category.docs[0])
}

export async function createCategory(data) {
    const category = categoriesCollection.doc()
    await category.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    })
    return mapCategory(await category.get())
}

export async function updateCategory(id, data) {
    const category = categoriesCollection.doc(id)
    await category.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    })
    return mapCategory(await category.get())
}

export async function deleteCategory(id) {
    await categoriesCollection.doc(id).delete()
}
```

### category.service.js
``` JS
import { AppError } from '../../shared/errors/app-error.js';
import * as categoryRepository from './category.repository.js';

export async function listCategories() {
    return await categoryRepository.listCategories();
}

export async function getCategory(id) {
    const category = await categoryRepository.findCategoryById(id);
    if (!category) {
        throw new AppError({
            statusCode: 404,
            code: 'CATEGORY_NOT_FOUND',
            message: 'Categoria no encontrada'
        });
    }
    return category;
}

export async function createCategory(data) {
    const exists = await categoryRepository.findCategoryBySlug(data.slug);
    if (exists) {
        throw new AppError({
            statusCode: 404,
            code: 'CATEGORY_SLUG_EXISTS',
            message: 'El slug ya existe'
        });
    }
    return await categoryRepository.createCategory(data);
}

export async function updateCategory(id, data) {
    await getCategory(id);
    if (data.slug) {
        const exists = await categoryRepository.findCategoryBySlug(data.slug);
        if (exists && exists.id !== id) {
            throw new AppError({
                statusCode: 404,
                code: 'CATEGORY_SLUG_EXISTS',
                message: 'El slug ya existe'
            });
        }
    }
    return await categoryRepository.updateCategory(id, data);
}

export async function deleteCategory(id) {
    await getCategory(id);
    return await categoryRepository.deleteCategory(id);
}
```

### category.controller.js
``` JS
import * as categoryService
  from './category.service.js'

export async function listCategories(
  req,
  res
) {
  const data =
    await categoryService
      .listCategories()

  return res.status(200).json({
    success:
      true,

    data,

    meta: {
      count:
        data.length,

      requestId:
        req.id
    }
  })
}

export async function getCategory(
  req,
  res
) {
  const data =
    await categoryService
      .getCategory(
        req.validated.params.id
      )

  return res.status(200).json({
    success:
      true,

    data,

    meta: {
      requestId:
        req.id
    }
  })
}

export async function createCategory(
  req,
  res
) {
  const data =
    await categoryService
      .createCategory(
        req.validated.body
      )

  return res.status(201).json({
    success:
      true,

    data,

    meta: {
      requestId:
        req.id
    }
  })
}

export async function updateCategory(
  req,
  res
) {
  const data =
    await categoryService
      .updateCategory(
        req.validated.params.id,
        req.validated.body
      )

  return res.status(200).json({
    success:
      true,

    data,

    meta: {
      requestId:
        req.id
    }
  })
}

export async function deleteCategory(
  req,
  res
) {
  await categoryService
    .deleteCategory(
      req.validated.params.id
    )

  return res
    .status(204)
    .send()
}
```

### category.routes.js
``` JS
import { Router } from 'express'
import * as controller from './category.controller.js'
import * as schema from './category.schema.js'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'

const router = Router()

router.get('/',
    validate(schema.listCategoriesSchema),
    asyncHandler(controller.listCategories)
)

router.get(
  '/:id',
  validate(schema.getCategorySchema),
  asyncHandler(controller.getCategory)
)

router.post('/',
    authenticate,
    authorize('products: create'),
    validate(schema.createCategorySchema),
    asyncHandler(controller.createCategory)
)
router.patch('/:id',
    authenticate,
    authorize('products: update'),
    validate(schema.updateCategorySchema),
    asyncHandler(controller.updateCategory)
)

router.delete('/:id',
    authenticate,
    authorize('products: delete'),
    validate(schema.deleteCategorySchema),
    asyncHandler(controller.deleteCategory)
)

export default router
```

### index.js
``` JS
import { Router } from 'express'

import healthRoutes from '../modules/health/health.routes.js'
import productRoutes from '../modules/products/product.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import userRoutes from '../modules/users/user.routes.js'
import categoryRoutes from '../modules/categories/category.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)

export default router
```

### product.schema.js
``` JS
import { z } from 'zod'

const emptyObject = z.object({}).default({})

const productIdParams = z.object({
  id: z.string().trim().min(1, 'Product id is required')
})

const skuSchema = z
  .string()
  .trim()
  .min(2, 'SKU must have at least 2 characters')
  .max(60, 'SKU is too long')
  .transform((value) => value.toUpperCase())

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Product name must have at least 2 characters')
  .max(150, 'Product name is too long')

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, 'Description is too long')
  .default('')

const priceSchema = z.coerce
  .number()
  .nonnegative('Price cannot be negative')

const stockSchema = z.coerce
  .number()
  .int('Stock must be an integer')
  .nonnegative('Stock cannot be negative')

const activeSchema = z.boolean()

const createProductBody = z.object({
  sku: skuSchema,
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  stock: stockSchema.default(0),
  active: activeSchema.default(true),
  categoryId: z.string().trim().min(1)
})

const updateProductBody = z
  .object({
    sku: skuSchema.optional(),
    name: nameSchema.optional(),
    description: z.string().trim().max(1000).optional(),
    price: priceSchema.optional(),
    stock: stockSchema.optional(),
    active: activeSchema.optional(),
    categoryId: z.string().trim().min(1)
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })

const activeQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined || value === '') return undefined
    if (value === true || value === 'true') return true
    if (value === false || value === 'false') return false
    return value
  },
  z.boolean().optional()
)

export const listProductsSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),
    active: activeQuerySchema
  })
})

export const getProductSchema = z.object({
  body: emptyObject,
  params: productIdParams,
  query: emptyObject
})

export const createProductSchema = z.object({
  body: createProductBody,
  params: emptyObject,
  query: emptyObject
})

export const updateProductSchema = z.object({
  body: updateProductBody,
  params: productIdParams,
  query: emptyObject
})

export const deleteProductSchema = z.object({
  body: emptyObject,
  params: productIdParams,
  query: emptyObject
})
```
