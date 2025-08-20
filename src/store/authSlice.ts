// src/store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Load user from localStorage if token exists
const loadUserFromStorage = (): Partial<AuthState> => {
  const token = localStorage.getItem('token');
  if (!token) return { initialized: true };
  
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return {
      user,
      isAuthenticated: true,
      initialized: true,
    };
  } catch (error) {
    console.error('Failed to parse user from localStorage', error);
    return { initialized: true };
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
  ...loadUserFromStorage(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    initializeAuth: (state) => {
      state.initialized = true;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;