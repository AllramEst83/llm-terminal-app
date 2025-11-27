import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { AuthDisabledScreen, AuthLoadingScreen } from './AuthStatusScreen';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { status, initializing, isAuthConfigured } = useAuth();

  if (!isAuthConfigured || status === 'disabled') {
    return <AuthDisabledScreen />;
  }

  if (initializing || status === 'idle' || status === 'loading') {
    return <AuthLoadingScreen message="Verifying session token..." />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

