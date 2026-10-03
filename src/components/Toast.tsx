import { useStore } from '../store';
import { CheckCircle2, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts } = useStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg animate-toast-in pointer-events-auto"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
