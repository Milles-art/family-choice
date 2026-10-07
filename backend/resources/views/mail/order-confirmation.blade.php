<!doctype html>
<html lang="en"><body>
<h1>FAMILY CHOICE SUPERMARKET</h1>
<p>Hello {{ $order->delivery['name'] }}, your order {{ $order->number }} has been saved.</p>
<p>Payment: {{ $order->payment_status === 'paid' ? 'Received and verified.' : ($order->payment_method === 'cash' ? 'Due on delivery or pickup.' : 'Awaiting confirmation. This email is not a payment receipt.') }}</p>
<ul>@foreach ($order->items as $item)<li>{{ $item->name }} × {{ $item->quantity }}</li>@endforeach</ul>
<p>Groceries: TSh {{ number_format($order->subtotal_cents / 100, 2) }}<br>
Delivery: TSh {{ number_format($order->delivery_cents / 100, 2) }}<br>
Tax: TSh {{ number_format($order->tax_cents / 100, 2) }}<br>
Total: TSh {{ number_format($order->total_cents / 100, 2) }}</p>
<p>{{ $order->delivery_option === 'pickup' ? 'Pickup' : 'Delivery' }} · {{ $order->time_slot }}</p>
<p><a href="{{ rtrim(config('app.url'), '/') }}/track?order={{ $order->id }}">Sign in to track your order</a></p>
</body></html>
