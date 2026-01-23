import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RequestPage from './pages/RequestPage';
import PlayerPage from './pages/PlayerPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/request" replace />} />

        <Route path="/request" element={
          <Layout>
            <RequestPage />
          </Layout>
        } />

        <Route path="/player" element={
          <PlayerPage />
        } />

        <Route path="/admin" element={
          <Layout>
            <AdminPage />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
