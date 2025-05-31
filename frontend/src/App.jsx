// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom'; // Removido useNavigate se não for usado diretamente aqui
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HubPage from './pages/HubPage/HubPage';
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import StoryPlayerPage from './pages/StoryPlayerPage/StoryPlayerPage';
import CreatorDashboardPage from './pages/DashboardPage/CreatorDashboardPage';
import './App.css';

// Componente de Navegação que pode mostrar/esconder links baseados na autenticação
function AppNavigation() {
  const { isAuthenticated, logout, currentUser } = useAuth(); // Adicionado currentUser se quiser exibir o nome/email

  return (
    <nav className="app-nav">
      <ul>
        {isAuthenticated ? (
          <>
            <li><Link to="/hub">HUB Principal</Link></li>
            <li><Link to="/editor">Criar/Editar História</Link></li>
            <li><Link to="/dashboard">Meu Dashboard</Link></li>
            {/* Opcional: Exibir nome do usuário
            {currentUser && currentUser.name && (
              <li className="nav-user-greeting">Olá, {currentUser.name}!</li>
            )}
            */}
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
          path="/story/play/:storyId"  // <--- ROTA MODIFICADA AQUI
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
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
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
    <AuthProvider>
      <AppNavigation />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;