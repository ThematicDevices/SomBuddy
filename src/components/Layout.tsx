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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop & Mobile Header */}
      <header
        className="backdrop-blur-xl sticky top-0 z-40"
        style={{ background: 'rgba(15,13,11,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #c4505a, #722f37)', boxShadow: '0 4px 12px rgba(114,47,55,0.4)' }}
              >
                <Wine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-lg sm:text-xl font-display font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Som Buddy
                </h1>
                <p className="text-[10px] sm:text-xs hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                  Your Personal Wine Catalog
                </p>
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
                      isActive ? '' : ''
                    }`
                  }
                  style={({ isActive }) => isActive
                    ? { background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-secondary)' }
                  }
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    if (!el.style.background || el.style.background === '') {
                      el.style.background = 'rgba(255,255,255,0.05)';
                      el.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    // Only reset if not active (active items have bg set via style prop)
                    if (el.style.background === 'rgba(255,255,255,0.05)') {
                      el.style.background = '';
                      el.style.color = 'var(--text-secondary)';
                    }
                  }}
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
                className="p-2 sm:p-2.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Search className="w-5 h-5" />
              </NavLink>
              <NavLink
                to="/settings"
                className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(196,80,90,0.15)' }}
                >
                  <User className="w-4 h-4" style={{ color: 'var(--accent-wine)' }} />
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
      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl z-40 safe-area-bottom"
        style={{ background: 'rgba(26,22,18,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] rounded-lg text-xs font-medium transition-colors relative"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={isActive ? 'w-6 h-6' : 'w-5 h-5'}
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  />
                  <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: 'var(--accent-gold)' }}
                    />
                  )}
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
