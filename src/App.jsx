import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RequestPage from './pages/RequestPage';
import PlayerPage from './pages/PlayerPage';
import AdminPage from './pages/AdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import HomePage from './pages/HomePage';
import { EstablishmentProvider } from './contexts/EstablishmentContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<HomePage />} />

        {/* Super Admin Route */}
        <Route path="/admin" element={
          <Layout>
            <SuperAdminPage />
          </Layout>
        } />
        {/* Redirect old super-admin path to new one for compatibility or just 404 - keeping clean here */}
        <Route path="/super-admin" element={<Navigate to="/admin" replace />} />

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

        {/* Catch-all for unknown routes - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
