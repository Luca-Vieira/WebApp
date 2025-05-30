import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // <-- IMPORTAR AuthProvider e useAuth
import ProtectedRoute from './components/ProtectedRoute';      // <-- IMPORTAR ProtectedRoute

import HubPage from './pages/HubPage/HubPage';
import MainPage from './pages/MainPage/MainPage'; // Seu editor
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import StoryPlayerPage from './pages/StoryPlayerPage/StoryPlayerPage';
import CreatorDashboardPage from './pages/DashboardPage/CreatorDashboardPage';
import './App.css';

// Componente de Navegação que pode mostrar/esconder links baseados na autenticação
function AppNavigation() {
  const { isAuthenticated, logout } = useAuth();
  // const navigate = useNavigate(); // Se precisar para o logout, mas o hook useAuth já faz

  return (
    <nav className="app-nav">
      <ul>
        {isAuthenticated ? (
          <>
            <li><Link to="/hub">HUB Principal</Link></li>
            <li><Link to="/editor">Criar/Editar História</Link></li>
            <li><Link to="/dashboard">Meu Dashboard</Link></li>
            <li><button onClick={logout} className="nav-logout-button">Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Cadastro</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <main className="app-content">
      <Routes>
        {/* Rota de Login é pública */}
        <Route path="/login" element={<LoginPage />} />
        {/* Rota de Registro é pública */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas Protegidas */}
        <Route 
          path="/hub" 
          element={
            <ProtectedRoute>
              <HubPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/editor" 
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/story/play" // No futuro: /story/play/:storyId
          element={
            <ProtectedRoute>
              <StoryPlayerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <CreatorDashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Rota Raiz: Se autenticado, vai para o Hub, senão para Login */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Navigate replace to="/hub" /> : <Navigate replace to="/login" />
          } 
        />
        
        {/* Rota para Página Não Encontrada */}
        <Route 
          path="*" 
          element={
            <div>
              <h2>404 - Página Não Encontrada</h2>
              <p><Link to={isAuthenticated ? "/hub" : "/login"}>Voltar para a página inicial</Link></p>
            </div>
          } 
        />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <AuthProvider> {/* Envolve toda a lógica de rotas com o AuthProvider */}
      {/* Você pode ter um container div aqui se precisar para o App.css global */}
      {/* <div className="app-router-container"> */} 
        <AppNavigation /> {/* Componente de navegação separado */}
        <AppRoutes />     {/* Componente que contém as rotas */}
      {/* </div> */}
    </AuthProvider>
  );
}

export default App;