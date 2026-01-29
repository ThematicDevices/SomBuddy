import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global handler to suppress AbortError from Supabase's internal lock mechanism
// These errors occur in React StrictMode due to double-mounting but are harmless
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof Error) {
    const message = event.reason.message || '';
    const name = event.reason.name || '';

    // Suppress AbortError from Supabase
    if (
      name === 'AbortError' ||
      message.includes('AbortError') ||
      message.includes('signal is aborted')
    ) {
      event.preventDefault();
      return;
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
