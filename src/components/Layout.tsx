import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Wine, Home, MessageCircle, PlusCircle, Settings, Search } from 'lucide-react';
import { ToastContainer } from './Toast';

export function Layout() {

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/collection', icon: Wine, label: 'Collection' },
    { to: '/add', icon: PlusCircle, label: 'Add Wine' },
    { to: '/sommelier', icon: MessageCircle, label: 'Sommelier' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-charcoal-50">
      <header className="bg-white shadow-sm border-b border-charcoal-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-wine-900 rounded-lg flex items-center justify-center">
                <Wine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-charcoal-900">Sommelier</h1>
                <p className="text-xs text-charcoal-500 hidden sm:block">Your Personal Wine Catalog</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-wine-50 text-wine-900'
                        : 'text-charcoal-600 hover:bg-charcoal-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <NavLink
              to="/search"
              className="p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </NavLink>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal-100 z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 4).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-wine-900' : 'text-charcoal-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <ToastContainer />
    </div>
  );
}
