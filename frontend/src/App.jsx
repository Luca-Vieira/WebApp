// frontend/src/App.jsx
import React from 'react'; // Adicionado import do React
import { Routes, Route, Link } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <nav className="app-nav">
        <ul>
          <li>
            <Link to="/">Página Inicial</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/register">Cadastro</Link>
          </li>
        </ul>
      </nav>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Futuramente, você pode adicionar uma rota para "Não Encontrado" (404)
          <Route path="*" element={<div>Página Não Encontrada</div>} /> 
          */}
        </Routes>
      </main>
    </div>
  );
}

export default App;