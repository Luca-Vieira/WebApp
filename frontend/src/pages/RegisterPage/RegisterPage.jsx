// frontend/src/pages/RegisterPage/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const API_URL = 'http://127.0.0.1:8000'; // URL do nosso backend FastAPI

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      if (response.status === 201) { // 201 Created
        const data = await response.json();
        alert(`Usuário ${data.name || name} registrado com sucesso! Faça o login para continuar.`);
        navigate('/login');
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido no registro." }));
        console.error('Falha no registro:', response.status, errorData);
        alert(`Falha no registro: ${errorData.detail || response.statusText}`);
      }

    } catch (error) {
      console.error('Erro na requisição de registro:', error);
      alert('Ocorreu um erro ao tentar registrar. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div className="register-page-container form-container">
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