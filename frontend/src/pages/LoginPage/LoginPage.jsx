// frontend/src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate para redirecionar após login
import './LoginPage.css'; // Estilos específicos para a página de login
// Importe os estilos globais do formulário de App.css se eles estiverem lá
// ou adicione classes de .form-container, .form-group, etc. aqui ou no LoginPage.css

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook para navegação programática

  const handleSubmit = (event) => {
    event.preventDefault();
    // Lógica de autenticação (simulada por enquanto)
    console.log('Dados de Login:', { email, password });
    alert('Login (simulado) com sucesso! Verifique o console.');
    // No futuro, após autenticação real:
    // navigate('/'); // Redireciona para a página principal
  };

  return (
    <div className="login-page-container form-container"> {/* Usando classes de App.css */}
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="form-button">Entrar</button>
      </form>
      <p className="form-switch-link">
        Não tem uma conta? <Link to="/register" className="form-link">Cadastre-se</Link>
      </p>
    </div>
  );
}

export default LoginPage;