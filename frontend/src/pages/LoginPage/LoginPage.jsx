// frontend/src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import { useAuth } from '../../context/AuthContext'; // <-- IMPORTAR useAuth
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // <-- USAR o hook useAuth
  const navigate = useNavigate();
  const location = useLocation(); // Para redirecionar após login

  const handleSubmit = async (event) => { // Tornada async se o login real for assíncrono
    event.preventDefault();
    
    // Lógica de autenticação (simulada por enquanto)
    console.log('Dados de Login para simulação:', { email, password });

    // Simulação de dados do usuário que viriam da API
    const fakeUserData = { email: email, name: email.split('@')[0] }; // Exemplo
    
    // Chama a função de login do AuthContext
    login(fakeUserData); // Passa dados para simulação

    // A navegação para '/hub' já é feita dentro da função login() do AuthContext.
    // Se você quiser redirecionar para a página que o usuário tentou acessar antes:
    // const from = location.state?.from?.pathname || "/hub";
    // navigate(from, { replace: true });
    // Mas por simplicidade, o login() do AuthContext já redireciona para /hub.
  };

  return (
    <div className="login-page-container form-container">
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