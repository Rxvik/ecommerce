# Vera Soto Axel Rainnier Evidencia 4

## Codigos Escritos

### product.schema.js
``` JS
import { z } from 'zod';

const productBodySchema = z.object({
    name: z.string().trim().min(3).max(120),
    slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(2000).default(''),
    price: z.number().finite().nonnegative(),
    stock: z.number().int().nonnegative(),
    category: z.string().trim().min(2).max(80),
    active: z.boolean().default(true)
});

const productIdParams = z.object({
    id: z.string().trim().min(1)
});

export const createProductSchema = z.object({
    body: productBodySchema,
    params: z.object({}),
    query: z.object({})
});

export const productIdSchema = z.object({
    body: z.object({}),
    params: productIdParams,
    query: z.object({})
});

export const updateProductSchema = z.object({
    body: productBodySchema.partial().refine((body) => {
        Object.keys(body).length > 0, {
            message: 'Se requiere minimo un campo'
        };
    }),
    params: productIdParams,
    query: z.object({})
});

export const listProductsSchema = z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20),
        active: z.enum(['true', 'false']).optional().transform((value) => { value === undefined ? undefined : value === 'true'}),
    })
});
```

### product.repository.js
``` JS
import { db } from '../../config/firebase.js'
import { FieldValue } from 'firebase-admin/firestore'

const productsCollection = db.collection('products')

function mapProduct(document) {
    if (!document.exists) {
        return null
    }

    const data = document.data()

    return {
        id: document.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toIOSString?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toIOSString?.() ?? null
    }
};

export async function createProduct(data) {
    const productRef = productsCollection.doc()

    await productRef.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    })

    const created = await productRef.get()

    return mapProduct(created)
};

export async function findProductById(id) {
    const product = await productsCollection.doc(id).get()
    return mapProduct(product)
};

export async function listProducts({ limit, active }) {
    let query = productsCollection.orderBy('createdAt', 'desc').limit(limit)

    if (active !== undefined) {
        query = productsCollection.where('active', '==', active).orderBy('createdAt', 'desc').limit(limit)
    }

    const products = await query.get()
    return products.docs.map(mapProduct)
};

export async function updateProduct(id, data) {
    const productToUpdate = productsCollection.doc(id)
    await productToUpdate.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
    })
    const product = await productToUpdate.get()
    return mapProduct(product)
}

export async function deleteProduct(id) {
    await productsCollection.doc(id).delete()
}

export async function findProductBySku(sku) {
    const product = await productsCollection.where('sku', '==', sku).limit(1).get()

    if (product.empty) {
        return null
    }

    return mapProduct(product.docs[0])
}
```

### product.service.js
``` JS
import { AppError } from '../../shared/errors/app-error.js';
import * as productRepository from './product.repository.js';

export function listProducts(filters) {
    return productRepository.listProducts(filters)
}

export async function getProduct(id) {
    const product = await productRepository.findProductById(id)

    if (!product) {
        throw new AppError({
            statusCode: 404,
            code: 'Producto_no_encontrado',
            message: 'Producto no encontrado'
        })
    }
    return product
}

export async function createProduct(data) {
    const existingProduct = await productRepository.findProductById(data.sku)
    if (existingProduct) {
        throw new AppError({
            statusCode: 409,
            code: 'Producto_con_sku_existente',
            message: 'Producto con sku existente'
        })
    }
    return productRepository.createProduct(data)
}

export async function updateProduct(id, changes) {
    const currentProduct = await getProduct(id)
    if (changes.sku && changes.sku !== currentProduct.sku) {
        const product = await productRepository.findProductBySku(changes.sku)
        if (product) {
            throw new AppError({
                statusCode: 409,
                code: 'Producto_con_sku_existente',
                message: 'Producto con sku existente'
            })
        }
    }
    return productRepository.updateProduct(id, changes)
}

export async function deleteProduct(id) {
    await getProduct(id)
    await productRepository.deleteProduct(id)
}
```

### product.controller.js
``` JS
import * as productService from './product.service.js';

export async function listProducts(req, res) {
    const products = await productService.listProducts(req.validate.query);
    return res.status(200).json({
        success: true,
        data: products,
        meta: {
            count: products.length,
            requestId: req.id
        }
    })
}

export async function getProduct(req, res) {
    const product = await productService.getProduct(req.validate.body);
    return res.status(200).json({
        success: true,
        data: product,
        meta: {
            requestId: req.id
        }
    })
}

export async function createProduct(req, res) {
    const product = await productService.createProduct(req.validate.params.id, req.validate.body);
    return res.status(200).json({
        success: true,
        data: product,
        meta: {
            requestId: req.id
        }
    })
}

export async function deleteProduct(req, res) {
    await productService.deleteProduct(req.validate.params.id)
    return res.status(204).send()
}

export async function updateProduct(req, res) {
    const product = await productService.updateProduct(req.validate.params.id, req.validate.body)
    return res.status(200).json({
        success: true,
        data: product,
        meta: {
            requestId: req.id
        }
    })
}
```

### product.routes.js
``` JS
import { Router } from 'express';
import { createProduct, getProduct, updateProduct, deleteProduct, listProducts } from './product.controller.js';
import { createProductSchema, listProductsSchema, productIdSchema, updateProductSchema } from './product.schema.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { validate} from '../../shared/middleware/validate.middleware.js';

const router = Router();

router.get('/', validate(listProductsSchema), asyncHandler(listProducts));
router.get('/:id', validate(productIdSchema), asyncHandler(getProduct));
router.post('/', validate(createProductSchema), asyncHandler(createProduct));
router.patch('/:id', validate(updateProductSchema), asyncHandler(updateProduct));
router.delete('/:id', validate(productIdSchema), asyncHandler(deleteProduct));

export default router;
```

### index.js
``` JS
import  { Router }  from 'express';
import  healthRoutes  from '../modules/health/health.routes.js';
import productRoutes from '../modules/products/product.routes.js';

const router = Router();

router.get('/', healthRoutes);
router.get('/product', productRoutes);

export default router;
```
