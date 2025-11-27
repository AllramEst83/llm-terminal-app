import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './presentation/components';
import { TerminalPage } from './presentation/pages/TerminalPage';
import { LoginPage } from './presentation/pages/LoginPage';
import { SignupPage } from './presentation/pages/SignupPage';

export const App: React.FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <TerminalPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/signup"
      element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
