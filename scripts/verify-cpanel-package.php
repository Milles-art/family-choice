<?php
// Disposable in-memory verification of the staged release; never uses the app DB.
$stage = $argv[1] ?? '';
if (!is_file($stage.'/vendor/autoload.php')) throw new RuntimeException('Staged vendor not ready');
foreach (['APP_ENV'=>'testing', 'APP_DEBUG'=>'false', 'DB_CONNECTION'=>'sqlite', 'DB_DATABASE'=>':memory:', 'DB_URL'=>'', 'CACHE_STORE'=>'array', 'SESSION_DRIVER'=>'array', 'QUEUE_CONNECTION'=>'sync', 'MAIL_MAILER'=>'array'] as $key=>$value) {
    putenv($key.'='.$value); $_ENV[$key]=$value; $_SERVER[$key]=$value;
}
$testKey = 'base64:'.base64_encode(random_bytes(32));
putenv('APP_KEY='.$testKey); $_ENV['APP_KEY']=$testKey; $_SERVER['APP_KEY']=$testKey;
require $stage.'/vendor/autoload.php';
$app = require $stage.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
if (Illuminate\Support\Facades\Artisan::call('migrate', ['--force'=>true]) !== 0) throw new RuntimeException('Staged migrations failed');
if (Illuminate\Support\Facades\Artisan::call('freshcart:products:import', ['path'=>'database/catalog/family-choice-products.json']) !== 0) throw new RuntimeException('Staged catalogue import failed');
if (App\Models\Product::count() !== 247) throw new RuntimeException('Staged catalogue incomplete');
foreach (App\Models\Product::all() as $product) {
    $view = $product->storefront();
    if (!$view['inStock'] || !$view['orderable'] || !is_file($stage.'/public'.$view['image'])) throw new RuntimeException('Staged product unavailable/image missing');
}
$request = Illuminate\Http\Request::create('/api/products','GET',server:['HTTP_ACCEPT'=>'application/json']);
$http = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $http->handle($request);
if ($response->getStatusCode() !== 200 || count(json_decode($response->getContent(),true)) !== 247) throw new RuntimeException('Staged API failed');
$http->terminate($request,$response);
echo "PASS staged production dependencies, all migrations, 247-product import, public images and catalogue API using SQLite memory only.\n";
