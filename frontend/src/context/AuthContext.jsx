import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Para armazenar dados do usuário no futuro
  const navigate = useNavigate();

  // Verifica o localStorage ao iniciar para manter o estado de login
  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('currentUser'); // Exemplo
    if (loggedInStatus === 'true') {
      setIsAuthenticated(true);
      if (storedUser) {
        //setCurrentUser(JSON.parse(storedUser)); // Descomente quando tiver dados do usuário
      }
    }
  }, []);

  const login = (userData) => { // userData pode ser email, ou objeto de usuário no futuro
    // No futuro, esta função faria uma chamada à API para /api/users/login
    // e, se bem-sucedida, receberia um token e dados do usuário.

    // Simulação de login:
    console.log("Simulando login para:", userData);
    localStorage.setItem('isAuthenticated', 'true');
    // localStorage.setItem('currentUser', JSON.stringify({ email: userData.email, name: "Usuário Simulado" })); // Exemplo
    setIsAuthenticated(true);
    // setCurrentUser({ email: userData.email, name: "Usuário Simulado" });
    navigate('/hub'); // Redireciona para o Hub após login
  };

  const logout = () => {
    // No futuro, esta função poderia invalidar um token na API.
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login'); // Redireciona para Login após logout
  };

  const value = {
    isAuthenticated,
    currentUser, // Você usará isso para pegar o nome do usuário
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook customizado para usar o AuthContext facilmente
export const useAuth = () => {
  return useContext(AuthContext);
};