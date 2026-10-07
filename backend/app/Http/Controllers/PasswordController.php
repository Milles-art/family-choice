<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);
        try {
            Password::sendResetLink($data);
        } catch (Throwable $exception) {
            Log::warning('Password reset mail unavailable', ['error_type' => class_basename($exception)]);
        }

        return response()->json(['message' => 'If an account exists for that email, a password reset link will be sent.']);
    }

    public function reset(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255', 'token' => 'required|string|max:512',
            'password' => 'required|string|min:8|max:128|confirmed']);
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            if (config('session.driver') === 'database') {
                DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
            }
            event(new PasswordReset($user));
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => 'This reset link is invalid or expired. Request another link.']);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }
}
