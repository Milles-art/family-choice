<?php

return [
    'currency' => env('STORE_CURRENCY', 'TZS'),
    'tax_rate' => (float) env('STORE_TAX_RATE', 0.18),
    'delivery_cents' => (int) env('STORE_DELIVERY_CENTS', 500000),
    'free_delivery_cents' => (int) env('STORE_FREE_DELIVERY_CENTS', 7500000),
    'mobile_money_enabled' => (bool) env('STORE_MOBILE_MONEY_ENABLED', false),
    'mobile_money_instructions' => env('STORE_MOBILE_MONEY_INSTRUCTIONS', ''),
];
