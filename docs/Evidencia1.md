# Titulo Principal

## Subtitulo 1

### Subtitulo 2

texto aqui nadamas equis de 

el codigo del middelware

``` JS
export function notFoundMiddleware(req, res) {
    return res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.originalurl} not found`
        },
        meta: {
            requestId: req.id
        }
    });
}
```

## Gite Repo

``` bash
git remote remove origin 
```