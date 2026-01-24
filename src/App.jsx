import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RequestPage from './pages/RequestPage';
import PlayerPage from './pages/PlayerPage';
import AdminPage from './pages/AdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import { EstablishmentProvider } from './contexts/EstablishmentContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/super-admin" replace />} />

        {/* Super Admin Route */}
        <Route path="/super-admin" element={
          <Layout>
            <SuperAdminPage />
          </Layout>
        } />

        {/* Establishment Routes */}
        <Route path="/e/:slug/*" element={
          <EstablishmentProvider>
            <Routes>
              <Route path="request" element={
                <Layout>
                  <RequestPage />
                </Layout>
              } />
              <Route path="player" element={
                <PlayerPage />
              } />
              <Route path="admin" element={
                <Layout>
                  <AdminPage />
                </Layout>
              } />
              <Route path="*" element={<Navigate to="request" replace />} />
            </Routes>
          </EstablishmentProvider>
        } />

        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
