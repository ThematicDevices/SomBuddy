import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WineProvider, AuthProvider, ToastProvider } from './contexts';
import { Layout, ProtectedRoute } from './components';
import {
  Dashboard,
  Collection,
  AddWine,
  WineDetail,
  Sommelier,
  Settings,
  Search,
  Login,
  Signup,
  ForgotPassword,
  RestaurantAdvisor
} from './pages';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WineProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="collection" element={<Collection />} />
                <Route path="add" element={<AddWine />} />
                <Route path="wine/:id" element={<WineDetail />} />
                <Route path="sommelier" element={<Sommelier />} />
                <Route path="restaurant" element={<RestaurantAdvisor />} />
                <Route path="settings" element={<Settings />} />
                <Route path="search" element={<Search />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WineProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
