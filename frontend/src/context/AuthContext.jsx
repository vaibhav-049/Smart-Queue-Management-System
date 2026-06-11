import { createContext, use, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { initiateSocket, disconnectSocket, joinUserRoom } from '../services/socket';
import { clearAuthToken, getPersistedToken, persistAuthToken } from '../utils/authStorage';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getPersistedToken());
  const [loading, setLoading] = useState(() => !!getPersistedToken());

  // Logout Function
  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setToken(null);
    disconnectSocket();
    toast.success('Logged out successfully');
  }, []);

  // Fetch logged-in user profile details
  const fetchCurrentUser = useCallback(async (tokenValue) => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.success) {
        const userVal = response.data.data;
        setUser(userVal);
        // Connect socket when user gets loaded
        const socket = initiateSocket(tokenValue);
        joinUserRoom(userVal._id || userVal.id);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Load user on startup if token exists
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    }
  }, [token, fetchCurrentUser]);

  // Handle unauthorized global event (dispatched from Axios response interceptor)
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
      toast.error('Session expired. Please login again.');
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, [logout]);

  // Login Function
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token: tokenVal, user: userVal } = response.data.data;
        persistAuthToken(tokenVal, rememberMe);
        setToken(tokenVal);
        setUser(userVal);
        initiateSocket(tokenVal);
        joinUserRoom(userVal._id || userVal.id);
        toast.success(`Welcome back, ${userVal.name}!`);
        return { success: true, user: userVal };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Register Function (Step 1: Send OTP)
  const register = async (name, email, phone, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, phone, password });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'OTP sent successfully!');
        return { success: true };
      }
      return { success: false, message: 'Invalid registration response' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Complete Registration
  const verifyRegister = async (email, otp) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-register', { email, otp });
      if (response.data && response.data.success) {
        const { token: tokenVal, user: userVal } = response.data.data;
        persistAuthToken(tokenVal, false);
        setToken(tokenVal);
        setUser(userVal);
        initiateSocket(tokenVal);
        joinUserRoom(userVal._id || userVal.id);
        toast.success('Registration successful!');
        return { success: true, user: userVal };
      }
      return { success: false, message: 'Invalid verification response' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed. Please check your OTP.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Update Profile Function
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      if (response.data && response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        toast.success('Profile updated successfully!');
        return { success: true, user: updatedUser };
      }
      return { success: false, message: 'Failed to update profile' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Profile update failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    verifyRegister,
    logout,
    updateProfile
  }), [user, token, loading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
