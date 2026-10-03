# Product import

The database is the store's source of truth for products, prices and stock. Use a JSON catalog with prices in whole Tanzanian shillings, then run:

```sh
php artisan freshcart:products:import database/seeders/data/products.json
```

Each item must have an `id`, `name` and `price`. Optional `stock` replaces inventory for that item; omit it to preserve the default of 100 for newly created products. Test imports on a copy of production data first.
