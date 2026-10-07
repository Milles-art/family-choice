<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Jobs\SendOrderConfirmation;
use App\Services\OrderPayments;
use App\Services\SelcomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreController extends Controller
{
    public function products()
    {
        return Product::latest()->get()->map(fn ($p) => $p->storefront());
    }

    public function register(Request $r)
    {
        $data = $r->validate(['name' => 'required|string|max:100', 'email' => 'required|email|max:255|unique:users', 'password' => 'required|string|min:8|max:128', 'privacyConsent' => 'accepted']);
        $user = new User(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password'])]);
        $user->forceFill(['privacy_consented_at' => now()])->save();
        Auth::login($user);
        $r->session()->regenerate();

        return response()->json($user->fresh(), 201);
    }

    public function login(Request $r)
    {
        $data = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        if (! Auth::attempt($data)) {
            throw ValidationException::withMessages(['email' => 'The email or password is incorrect.']);
        }
        $r->session()->regenerate();

        return response()->json($r->user());
    }

    public function logout(Request $r)
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return response()->noContent();
    }

    public function orders(Request $r)
    {
        return Order::where('user_id', $r->user()->id)->with('items')->latest()->get();
    }

    public function checkout(Request $r, SelcomService $selcom, OrderPayments $payments)
    {
        $delivery = $r->input('delivery', []);
        if (is_array($delivery) && array_key_exists('phone', $delivery)) {
            $delivery['phone'] = preg_replace('/[\s()-]/', '', (string) $delivery['phone']);
            $r->merge(['delivery' => $delivery]);
        }

        $methods = ['cash'];
        if (config('store.mobile_money_enabled')) {
            $methods[] = 'mobile_money';
        }
        if ($selcom->enabled()) {
            $methods[] = 'selcom';
        }
        $paymentMethods = 'required|in:'.implode(',', $methods);
        if ($r->input('paymentMethod') === 'selcom') {
            $r->merge(['payerPhone' => SelcomService::normalizePhone($r->input('payerPhone'))]);
        }
        $d = $r->validate([
            'requestId' => 'required|uuid', 'items' => 'required|array|min:1|max:100',
            'items.*.productId' => 'required|string|distinct|exists:products,id', 'items.*.quantity' => 'required|integer|min:1|max:100',
            'delivery.name' => 'required|string|max:100', 'delivery.phone' => ['required', 'string', 'max:30', 'regex:/^(?:\\+255|0)[67]\\d{8}$/'],
            'delivery.address' => 'required_if:deliveryOption,delivery|nullable|string|max:255',
            'delivery.city' => 'required_if:deliveryOption,delivery|nullable|string|max:100',
            'delivery.zip' => 'nullable|string|max:30', 'delivery.instructions' => 'nullable|string|max:1000',
            'deliveryOption' => 'required|in:delivery,pickup', 'timeSlot' => 'required|string|max:100', 'paymentMethod' => $paymentMethods,
            'paymentProvider' => ['required_if:paymentMethod,mobile_money,selcom', 'nullable', 'string', 'max:50', ...($r->input('paymentMethod') === 'selcom' ? ['in:mpesa,tigopesa,airtelmoney,halopesa'] : [])],
            'payerPhone' => ['required_if:paymentMethod,selcom', 'nullable', 'regex:/^255[67]\d{8}$/'],
            'paymentReference' => 'required_if:paymentMethod,mobile_money|nullable|string|max:100',
        ]);
        $order = DB::transaction(function () use ($r, $d) {
            // Serialize each customer's requests, including retries, before stock changes.
            User::whereKey($r->user()->id)->lockForUpdate()->firstOrFail();
            $existing = Order::where('user_id', $r->user()->id)->where('request_id', $d['requestId'])->first();
            if ($existing) {
                return $existing;
            }
            $lines = [];
            $subtotal = 0;
            $requested = collect($d['items'])->sortBy('productId');
            foreach ($requested as $item) {
                $p = Product::whereKey($item['productId'])->lockForUpdate()->firstOrFail();
                if ($p->stock < $item['quantity']) {
                    throw ValidationException::withMessages(['items' => ($p->details['name'] ?? $p->id).' has insufficient stock.']);
                }
                $subtotal += $p->price_cents * $item['quantity'];
                $lines[] = ['product_id' => $p->id, 'name' => $p->details['name'], 'image' => $p->details['image'], 'quantity' => $item['quantity'], 'price_cents' => $p->price_cents];
                $p->decrement('stock', $item['quantity']);
            }
            $fee = $d['deliveryOption'] === 'pickup' || $subtotal >= config('store.free_delivery_cents') ? 0 : config('store.delivery_cents');
            $tax = (int) round($subtotal * config('store.tax_rate'));
            $normalTotal = $subtotal + $fee + $tax;
            $order = Order::create(['user_id' => $r->user()->id, 'request_id' => $d['requestId'], 'number' => 'FC-'.strtoupper(Str::random(12)),
                'delivery' => $d['delivery'], 'delivery_option' => $d['deliveryOption'], 'time_slot' => $d['timeSlot'],
                'payment_method' => $d['paymentMethod'],
                'payment_status' => $d['paymentMethod'] === 'selcom' ? 'pending' : 'unpaid',
                'payment_details' => $d['paymentMethod'] === 'mobile_money' ? ['provider' => $d['paymentProvider'], 'reference' => $d['paymentReference']] : null,
                'subtotal_cents' => $subtotal, 'delivery_cents' => $fee, 'tax_cents' => $tax, 'total_cents' => $normalTotal]);
            $order->items()->createMany($lines);

            return $order;
        }, 3);

        if ($order->wasRecentlyCreated) {
            try {
                SendOrderConfirmation::dispatch($order->id)->afterCommit();
            } catch (\Throwable $exception) {
                Log::warning('Order confirmation could not be queued', ['order_id' => $order->id, 'error_type' => class_basename($exception)]);
            }
        }
        if ($order->payment_method === 'selcom' && $order->wasRecentlyCreated) {
            $payments->initiate($order, $d['paymentProvider'], $d['payerPhone']);
        }

        return response()->json($order->fresh()->load('items'), 201);
    }

    private function admin(Request $r): void
    {
        abort_unless($r->user()->is_admin, 403);
    }

    public function adminOrders(Request $r)
    {
        $this->admin($r);

        return Order::with('items')->latest()->get();
    }

    public function updateOrder(Request $r, Order $order)
    {
        $this->admin($r);
        $d = $r->validate(['status' => 'sometimes|in:pending,processing,out_for_delivery,delivered', 'payment_status' => 'sometimes|in:unpaid,paid']);
        if ($order->payment_method === 'selcom' && array_key_exists('payment_status', $d)) {
            throw ValidationException::withMessages(['payment_status' => 'Selcom payments must be verified by the payment provider.']);
        }
        $before = $order->only(['status', 'payment_status']);
        $order->update($d);
        $this->audit($r, 'order.updated', 'order', (string) $order->id, $before, $order->only(['status', 'payment_status']));

        return $order->load('items');
    }

    public function updateProduct(Request $r, Product $product)
    {
        $this->admin($r);
        $d = $r->validate(['price_cents' => 'sometimes|integer|min:1|max:10000000', 'stock' => 'sometimes|integer|min:0|max:1000000']);
        $before = $product->only(['price_cents', 'stock']);
        $product->update($d);
        $this->audit($r, 'product.updated', 'product', (string) $product->id, $before, $product->only(['price_cents', 'stock']));

        return $product->storefront();
    }

    public function requestErasure(Request $r)
    {
        DB::table('privacy_requests')->updateOrInsert(
            ['user_id' => $r->user()->id, 'type' => 'erasure', 'status' => 'pending'],
            ['updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['message' => 'Your account erasure request has been received.']);
    }

    private function audit(Request $r, string $action, string $subjectType, string $subjectId, array $before, array $after): void
    {
        DB::table('admin_audits')->insert([
            'user_id' => $r->user()->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'before' => json_encode($before),
            'after' => json_encode($after),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
