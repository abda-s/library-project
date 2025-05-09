import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios'; // For direct API calls within AuthContext

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null); // Specific error state for AuthContext operations

  // Effect to load token and user from localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set global header for axios if token exists. useApi will also set it per request.
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setAuthLoading(false);
  }, []);

  // Update token state when localStorage changes (e.g., after login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem('token');
      setToken(currentToken);
      if (currentToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Initialize token state from localStorage
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const login = useCallback(async (username, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Use axios directly here, not useApi
      const response = await axios.post('http://localhost:4000/api/auth/login', { username, password });
      const { token: rawTokenFromServer, userId, role, username: loggedInUsername } = response.data;
      
      let finalTokenString = null;
      console.log('[AuthContext] Raw token received from server:', rawTokenFromServer, '(type:', typeof rawTokenFromServer, ')');

      if (Array.isArray(rawTokenFromServer)) {
        console.log('[AuthContext] Token is a direct array. Joining with ".".');
        finalTokenString = rawTokenFromServer.join('.');
      } else if (typeof rawTokenFromServer === 'string') {
        try {
          // Attempt to parse if it's a JSON string representing an array
          const parsedToken = JSON.parse(rawTokenFromServer);
          if (Array.isArray(parsedToken)) {
            console.log('[AuthContext] Token was a JSON string of an array. Joining with ".".');
            finalTokenString = parsedToken.join('.');
          } else {
            // It's a string, but not a JSON array. Assume it's the JWT itself.
            console.log('[AuthContext] Token is a string, not a JSON array. Using as is.');
            finalTokenString = rawTokenFromServer;
          }
        } catch (e) {
          // JSON.parse failed, so it's likely a plain string (hopefully the JWT)
          console.log('[AuthContext] Token is a plain string (JSON.parse failed). Using as is.');
          finalTokenString = rawTokenFromServer;
        }
      } else {
        console.error('[AuthContext] Token from server is not a string or array. Login failed.', rawTokenFromServer);
        setAuthError({ message: 'Received invalid token format from server.' });
        setAuthLoading(false);
        return { success: false, message: 'Invalid token format from server.' };
      }
      
      // Basic validation for JWT structure (three parts separated by dots)
      if (typeof finalTokenString !== 'string' || finalTokenString.split('.').length !== 3) {
          console.error('[AuthContext] Processed token is not a valid JWT format:', finalTokenString);
          setAuthError({ message: 'Processed token is invalid.' });
          setAuthLoading(false);
          return { success: false, message: 'Processed token is invalid.' };
      }

      console.log('[AuthContext] Storing final processed token in localStorage:', finalTokenString);
      localStorage.setItem('token', finalTokenString);
      
      const userData = { userId, role, username: loggedInUsername };
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(finalTokenString);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${finalTokenString}`;
      setAuthLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      const message = error.response?.data?.message || 'Login failed';
      setAuthError({ message });
      setAuthLoading(false);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (username, password, role) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Use axios directly here
      await axios.post('http://localhost:4000/api/auth/register', { username, password, role });
      setAuthLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      const message = error.response?.data?.message || 'Registration failed';
      setAuthError({ message });
      setAuthLoading(false);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null); // Update state
    setUser(null);
    delete axios.defaults.headers.common['Authorization']; // Clear global header
    // No need to navigate here, components using logout can handle navigation if needed
    // or useApi's error handler will navigate on 401/403 from a failed request after logout.
  }, []);

  return (
    <AuthContext.Provider value={{
        user,
        token,
        login,
        logout,
        register,
        loading: authLoading, // Only authLoading from this context
        error: authError, // Specific error from this context's operations
        clearAuthError: () => setAuthError(null) // Function to clear auth error
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};