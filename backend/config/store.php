<?php

return [
    'trusted_proxies' => env('TRUSTED_PROXIES', ''),
    'unpaid_cancel_minutes' => (int) env('STORE_UNPAID_CANCEL_MINUTES', 45),
    'unconfirmed_order_hours' => (int) env('STORE_UNCONFIRMED_ORDER_HOURS', 0),
    'max_open_orders' => (int) env('STORE_MAX_OPEN_ORDERS', 3),
    'admin_allowed_ips' => array_values(array_filter(array_map('trim', explode(',', env('ADMIN_ALLOWED_IPS', ''))))),
    'csp_mode' => env('STORE_CSP_MODE', 'report-only'),
    'hsts' => (bool) env('STORE_HSTS', false),
    'currency' => env('STORE_CURRENCY', 'TZS'),
    'tax_rate' => (float) env('STORE_TAX_RATE', 0.18),
    'delivery_cents' => (int) env('STORE_DELIVERY_CENTS', 500000),
    'free_delivery_cents' => (int) env('STORE_FREE_DELIVERY_CENTS', 7500000),
    'mobile_money_enabled' => (bool) env('STORE_MOBILE_MONEY_ENABLED', false),
    'mobile_money_instructions' => env('STORE_MOBILE_MONEY_INSTRUCTIONS', ''),
];
