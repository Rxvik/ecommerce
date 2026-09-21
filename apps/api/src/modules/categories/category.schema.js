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
