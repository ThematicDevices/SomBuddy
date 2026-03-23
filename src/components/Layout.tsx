import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Wine, Home, MessageCircle, PlusCircle, Settings, Search, User, UtensilsCrossed } from 'lucide-react';
import { ToastContainer } from './Toast';
import { useAuth } from '../contexts';

export function Layout() {
  const { profile } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/collection', icon: Wine, label: 'Collection' },
    { to: '/add', icon: PlusCircle, label: 'Add' },
    { to: '/sommelier', icon: MessageCircle, label: 'Sommelier' },
    { to: '/restaurant', icon: UtensilsCrossed, label: 'Restaurant' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Desktop & Mobile Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-charcoal-100/60 shadow-none sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #722f37, #430d1c)' }}>
                <Wine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-display font-bold text-charcoal-900 tracking-tight">Som Buddy</h1>
                  <p className="text-[10px] sm:text-xs text-charcoal-500 hidden sm:block">Your Personal Wine Catalog</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-wine-900 text-white'
                        : 'text-charcoal-600 hover:bg-charcoal-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <NavLink
                to="/search"
                className="p-2 sm:p-2.5 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </NavLink>
              <NavLink
                to="/settings"
                className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 text-charcoal-600 hover:bg-charcoal-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 bg-wine-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-wine-700" />
                </div>
                <span className="text-sm font-medium hidden lg:inline max-w-[100px] truncate">
                  {profile?.full_name || 'Account'}
                </span>
              </NavLink>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-charcoal-100 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-wine-900'
                    : 'text-charcoal-500 active:bg-charcoal-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={isActive ? 'w-6 h-6' : 'w-5 h-5'} />
                  <span className="text-[10px]">{label}</span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-wine-900 mt-0.5" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <ToastContainer />
    </div>
  );
}
