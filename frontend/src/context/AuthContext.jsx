import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000'; // URL do nosso backend FastAPI

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('currentUser'); // Pode ser usado como fallback inicial ou removido

      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setIsAuthenticated(true);
            setCurrentUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData)); // Garante que o LS está atualizado
          } else {
            console.log("Token inválido ou expirado durante a inicialização, limpando storage.");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Erro ao validar token na inicialização:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('currentUser');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else if (storedUser) {
        // Limpa se houver usuário no LS mas não houver token
        localStorage.removeItem('currentUser');
      }
    };

    initializeAuth();
  }, []); // Roda uma vez na montagem

  const login = async (loginData) => { // loginData: { email, password }
    try {
      const params = new URLSearchParams();
      params.append('username', loginData.email);
      params.append('password', loginData.password);

      const response = await fetch(`${API_URL}/api/users/login/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido no login." }));
        console.error('Falha no login:', response.status, errorData);
        alert(`Falha no login: ${errorData.detail || response.statusText}`);
        return;
      }

      const data = await response.json(); // { access_token: "...", token_type: "bearer" }
      
      if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
        
        const userProfileResponse = await fetch(`${API_URL}/api/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (userProfileResponse.ok) {
            const userData = await userProfileResponse.json();
            localStorage.setItem('currentUser', JSON.stringify(userData));
            setCurrentUser(userData);
        } else {
            console.error('Falha ao buscar perfil do usuário após login:', userProfileResponse.status);
            // Poderia tratar este erro de forma mais robusta, como limpar o token
        }

        setIsAuthenticated(true);
        navigate('/hub');
      }

    } catch (error) {
      console.error('Erro na requisição de login:', error);
      alert('Ocorreu um erro ao tentar fazer login. Verifique o console para mais detalhes.');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const value = {
    isAuthenticated,
    currentUser,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};