<?php

return ['currency' => env('STORE_CURRENCY', 'USD'), 'tax_rate' => (float) env('STORE_TAX_RATE', 0.08), 'delivery_cents' => (int) env('STORE_DELIVERY_CENTS', 399), 'free_delivery_cents' => (int) env('STORE_FREE_DELIVERY_CENTS', 3500)];
