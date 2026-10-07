import type { InputHTMLAttributes } from 'react';
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };
export function FormField({ label, error, id, name, className = '', ...props }: Props) {
  const fieldId = id ?? name;
  return <div className={className}><label htmlFor={fieldId} className="block text-sm font-semibold mb-2">{label}{props.required && <span aria-hidden="true"> *</span>}</label><input {...props} name={name} id={fieldId} aria-invalid={!!error} aria-describedby={error ? `${fieldId}-error` : undefined} className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl"/>{error && <p id={`${fieldId}-error`} className="text-sm text-red-700 mt-2">{error}</p>}</div>;
}
