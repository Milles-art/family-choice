<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreController extends Controller
{
    public function products()
    {
        return Product::all()->map(fn ($p) => $p->storefront());
    }

    public function register(Request $r)
    {
        $data = $r->validate(['name' => 'required|string|max:100', 'email' => 'required|email|max:255|unique:users', 'password' => 'required|string|min:8|max:128']);
        $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password'])]);
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

    public function checkout(Request $r)
    {
        $d = $r->validate([
            'requestId' => 'required|uuid', 'items' => 'required|array|min:1|max:100',
            'items.*.productId' => 'required|string|distinct|exists:products,id', 'items.*.quantity' => 'required|integer|min:1|max:100',
            'delivery.name' => 'required|string|max:100', 'delivery.phone' => 'required|string|max:30',
            'delivery.address' => 'required_if:deliveryOption,delivery|nullable|string|max:255',
            'delivery.city' => 'required_if:deliveryOption,delivery|nullable|string|max:100',
            'delivery.zip' => 'nullable|string|max:30', 'delivery.instructions' => 'nullable|string|max:1000',
            'deliveryOption' => 'required|in:delivery,pickup', 'timeSlot' => 'required|string|max:100', 'paymentMethod' => 'required|in:cash',
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
            $order = Order::create(['user_id' => $r->user()->id, 'request_id' => $d['requestId'], 'number' => 'FC-'.strtoupper(Str::random(12)),
                'delivery' => $d['delivery'], 'delivery_option' => $d['deliveryOption'], 'time_slot' => $d['timeSlot'],
                'subtotal_cents' => $subtotal, 'delivery_cents' => $fee, 'tax_cents' => $tax, 'total_cents' => $subtotal + $fee + $tax]);
            $order->items()->createMany($lines);

            return $order;
        }, 3);

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
        $order->update($d);

        return $order->load('items');
    }

    public function updateProduct(Request $r, Product $product)
    {
        $this->admin($r);
        $d = $r->validate(['price_cents' => 'sometimes|integer|min:1|max:10000000', 'stock' => 'sometimes|integer|min:0|max:1000000']);
        $product->update($d);

        return $product->storefront();
    }
}
