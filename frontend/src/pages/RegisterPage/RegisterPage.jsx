// frontend/src/pages/RegisterPage/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';
// Importe os estilos globais do formulário de App.css se eles estiverem lá
// ou adicione classes de .form-container, .form-group, etc. aqui ou no RegisterPage.css

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    // Lógica de cadastro (simulada por enquanto)
    console.log('Dados de Cadastro:', { name, email, password });
    alert('Cadastro (simulado) com sucesso! Verifique o console.');
    // No futuro, após cadastro real:
    // navigate('/login'); // Redireciona para a página de login
  };

  return (
    <div className="register-page-container form-container"> {/* Usando classes de App.css */}
      <h2>Criar Conta</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="name">Nome:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
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
            minLength="6"
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Senha:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="6"
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="form-button">Cadastrar</button>
      </form>
      <p className="form-switch-link">
        Já tem uma conta? <Link to="/login" className="form-link">Faça login</Link>
      </p>
    </div>
  );
}

export default RegisterPage;