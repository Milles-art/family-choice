<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Services\OrderPayments;
use App\Services\SelcomException;
use App\Services\SelcomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function status(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return response()->json(['payment_status' => OrderPayments::status($order->payment_status),
            'message' => $order->payment_message, ...($order->confirmation_email_sent_at ? [
                'confirmation_email_sent' => true, 'confirmation_email' => $order->confirmation_email,
            ] : [])]);
    }

    public function retry(Request $request, Order $order, SelcomService $selcom, OrderPayments $payments)
    {
        abort_unless($order->user_id === $request->user()->id, 404);
        abort_unless($selcom->enabled(), 503, 'Mobile-money payments are unavailable.');
        abort_unless($order->payment_method === 'selcom', 422, 'This order does not use Selcom.');
        $request->merge(['phone' => SelcomService::normalizePhone($request->input('phone'))]);
        $data = $request->validate(['network' => 'required|in:mpesa,tigopesa,airtelmoney,halopesa', 'phone' => ['required', 'regex:/^255[67]\d{8}$/']]);
        try {
            $payments->retry($order, $data['network'], $data['phone']);
        } catch (SelcomException $exception) {
            throw ValidationException::withMessages(['payment' => $exception->getMessage()]);
        }
        $order->refresh();

        return response()->json(['payment_url' => $order->payment_url, 'payment_status' => $order->payment_status, 'message' => $order->payment_message]);
    }

    public function webhook(Request $request, SelcomService $selcom, OrderPayments $payments)
    {
        abort_unless($selcom->enabled(), 503);
        $data = $request->validate(['order_id' => 'required|string|max:64']);
        $attempt = PaymentAttempt::where('selcom_order_id', $data['order_id'])->firstOrFail();
        // The payload is only a lookup hint. All payment fields come from a signed
        // outbound status request, bound to our saved order ID and server total.
        try {
            $payments->verify($attempt);
        } catch (SelcomException $exception) {
            Log::warning('Selcom callback not verified', ['order_id' => $attempt->order_id]);

            return response()->json(['message' => 'Payment could not be verified.'], 409);
        }

        return response()->json(['received' => true]);
    }
}
