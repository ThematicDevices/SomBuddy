import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WineProvider, AuthProvider, ToastProvider, ChatProvider, ApiKeyProvider } from './contexts';
import { Layout, ProtectedRoute, ErrorBoundary } from './components';
import {
  Dashboard,
  Collection,
  AddWine,
  BatchAddWines,
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
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ApiKeyProvider>
            <WineProvider>
              <ChatProvider>
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
                    <Route path="add/batch" element={<BatchAddWines />} />
                    <Route path="wine/:id" element={<WineDetail />} />
                    <Route path="sommelier" element={<Sommelier />} />
                    <Route path="restaurant" element={<RestaurantAdvisor />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="search" element={<Search />} />
                  </Route>
                </Routes>
                </BrowserRouter>
              </ChatProvider>
            </WineProvider>
          </ApiKeyProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
