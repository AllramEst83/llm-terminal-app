import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { AuthDisabledScreen, AuthLoadingScreen } from './AuthStatusScreen';

interface PublicRouteProps {
  children: React.ReactElement;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { status, initializing, isAuthConfigured } = useAuth();

  if (!isAuthConfigured || status === 'disabled') {
    return <AuthDisabledScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  if (initializing || status === 'idle') {
    return <AuthLoadingScreen message="Initializing secure terminal..." />;
  }

  return children;
};

