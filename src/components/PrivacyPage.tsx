import { ChevronRight, Home, ShieldCheck } from 'lucide-react';
import { useStore } from '../store';

export function PrivacyPage() {
  const { navigate } = useStore();

  return (
    <div className="reading-container py-8">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-green-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Privacy Notice</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-green-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Privacy Notice</h1><p className="text-sm text-gray-500">Last updated: 3 October 2026</p></div>
        </div>
        <div className="space-y-5 text-sm leading-6 text-gray-700">
          <section><h2 className="font-bold text-gray-900">Information we use</h2><p>We use your name, email address, phone number, delivery details and order history to create your account, fulfill orders, handle payments and provide customer support.</p></section>
          <section><h2 className="font-bold text-gray-900">Who can access it</h2><p>Only authorised store staff can access the information needed to prepare, deliver and support your order. Administrative changes to products and orders are recorded for accountability.</p></section>
          <section><h2 className="font-bold text-gray-900">How long we keep it</h2><p>We retain order and payment records only for as long as required for operations, tax, accounting and legal obligations.</p></section>
          <section><h2 className="font-bold text-gray-900">Your choices</h2><p>You can ask about your account information or request erasure from My Account. Some order records may need to be retained where the law requires it. We will verify requests before taking action.</p></section>
          <section><h2 className="font-bold text-gray-900">Contact</h2><p>Manage your account information and submit a data-erasure request from My Account.</p></section>
          
        </div>
      </div>
    </div>
  );
}
