import { createContext, useState, useContext, useEffect, useRef } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3000';
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

const apiFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return response;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    lastActivityRef.current = Date.now();
    
    // Set timer to logout after SESSION_TIMEOUT
    inactivityTimerRef.current = setTimeout(() => {
      console.log('Session timeout: No activity for 15 minutes');
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  };

  // Handle session timeout
  const handleSessionTimeout = async () => {
    // Clear user state
    setUser(null);
    
    // Try to logout on server (clean up cookies)
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Redirect to login page
    window.location.href = '/login?timeout=true';
  };

  // Track user activity
  const trackActivity = () => {
    if (user) {
      resetInactivityTimer();
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (user) {
      // Reset timer on user login
      resetInactivityTimer();
      
      // Add event listeners for user activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        window.addEventListener(event, trackActivity);
      });
      
      // Clean up event listeners
      return () => {
        events.forEach(event => {
          window.removeEventListener(event, trackActivity);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
    
    // Clean up localStorage on mount
    if (localStorage.getItem('accessToken')) {
      localStorage.removeItem('accessToken');
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiFetch('/api/v1/auth/check');
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          resetInactivityTimer(); // Start timer on successful auth
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.removeItem('accessToken');
        resetInactivityTimer(); // Start inactivity timer
        return { success: true };
      }
      
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  };

  const authenticatedFetch = async (endpoint, options = {}) => {
    // Reset inactivity timer on API call (user is active)
    if (user) {
      resetInactivityTimer();
    }
    
    const response = await apiFetch(endpoint, options);
    
    // If unauthorized, session expired
    if (response.status === 401) {
      setUser(null);
      window.location.href = '/login?timeout=true';
      throw new Error('Session expired');
    }
    
    return response;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, authenticatedFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { apiFetch };