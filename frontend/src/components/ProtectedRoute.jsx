import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redireciona para a página de login, mas guarda a localização atual
    // para que possamos redirecionar de volta após o login (opcional).
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // Renderiza o componente filho (a página protegida)
};

export default ProtectedRoute;