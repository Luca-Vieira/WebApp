// frontend/src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // useLocation e useNavigate podem ser removidos se não usados diretamente aqui.
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // Obtém a função login do AuthContext
  
  // useNavigate e useLocation são mantidos por enquanto, mas a navegação principal
  // após o login agora é tratada pelo AuthContext.
  // const navigate = useNavigate(); 
  // const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Chama a função login do AuthContext com os dados do formulário.
    // A função login no AuthContext agora é assíncrona e lida com a chamada à API.
    await login({ email, password });

    // A navegação para '/hub' ou outra rota protegida é feita
    // dentro da função login do AuthContext após o sucesso da autenticação.
    // Não é mais necessário navegar daqui.
    // Ex: const from = location.state?.from?.pathname || "/hub";
    // navigate(from, { replace: true });
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