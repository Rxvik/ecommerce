import { z } from 'zod';

const empty = z.object({}).default({});

export const getCartSchema = z.object({
    body: empty,
    query: empty,
    params: empty
});

export const addItemSchema = z.object ({
    body: z.strictObject({
        productId: z.string().trim().min(1),
        quantiry: z.coerce.number().int().positive().max(99)
    }),
    params: empty,
    query: empty
})

export const removeItemSchema = z.object ({
    body: empty,
    params: z.strictObject({
        productId: z.string().trim().min(1)
    }),
    query: empty
})
