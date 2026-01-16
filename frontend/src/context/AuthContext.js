import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({
  admin: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));

  useEffect(() => {
    // Check if token exists and validate
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_data');
    
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        logout();
      }
    }
  }, []);

  const login = (tokenData, adminData) => {
    setToken(tokenData);
    setAdmin(adminData);
    localStorage.setItem('admin_token', tokenData);
    localStorage.setItem('admin_data', JSON.stringify(adminData));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
  };

  return (
    <AuthContext.Provider value={{ 
      admin, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
