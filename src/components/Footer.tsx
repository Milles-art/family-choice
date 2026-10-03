import { useStore } from '../store';
import { categories } from '../data';
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  const { navigate } = useStore();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      {/* Newsletter */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white text-lg font-bold">Stay in the loop</h3>
            <p className="text-sm mt-1">Get exclusive deals and recipes delivered to your inbox</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Fresh<span className="text-green-500">Cart</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Your neighborhood online supermarket. Fresh groceries delivered to your door, same day.
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Shop</h4>
            <ul className="space-y-2">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigate({ name: 'catalog', categoryId: cat.id })}
                    className="text-sm hover:text-green-400 transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Store Locator', 'Blog', 'Sustainability'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm hover:text-green-400 transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>123 Market Street, Springfield, ST 12345</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@freshcart.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs">© 2026 FreshCart. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-green-400 transition-colors" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <a href="#" className="hover:text-green-400 transition-colors" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>
            <a href="#" className="hover:text-green-400 transition-colors" onClick={(e) => e.preventDefault()}>
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
