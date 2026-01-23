import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WineProvider, ApiKeyProvider, ToastProvider } from './contexts';
import { Layout } from './components';
import {
  Dashboard,
  Collection,
  AddWine,
  WineDetail,
  Sommelier,
  Settings,
  Search
} from './pages';

function App() {
  return (
    <ToastProvider>
      <ApiKeyProvider>
        <WineProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="collection" element={<Collection />} />
                <Route path="add" element={<AddWine />} />
                <Route path="wine/:id" element={<WineDetail />} />
                <Route path="sommelier" element={<Sommelier />} />
                <Route path="settings" element={<Settings />} />
                <Route path="search" element={<Search />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WineProvider>
      </ApiKeyProvider>
    </ToastProvider>
  );
}

export default App;
