<?php
return [
    ...json_decode(file_get_contents(__DIR__.'/../resources/seo/site.json'), true, 512, JSON_THROW_ON_ERROR),
    'google_verification' => env('GOOGLE_SITE_VERIFICATION', ''),
];
