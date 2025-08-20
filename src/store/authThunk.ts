// src/store/authThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../service/userService';
import { loginSuccess, loginFailure, loginStart, initializeAuth } from './authSlice';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { dispatch }) => {
    try {
      dispatch(loginStart());
      const user = await loginUser(email, password);
      // Store both token and user data
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(loginSuccess(user));
      return user;
    } catch (error: any) {
      dispatch(loginFailure(error.message || 'Login failed'));
      throw error;
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { firstName: string; lastName: string; email: string; password: string }, { dispatch }) => {
    try {
      const user = await registerUser(userData);
      // Auto-login after registration
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(loginSuccess(user));
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }
);

// Add this to check auth status when app loads
export const checkAuth = () => (dispatch: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        dispatch(loginSuccess(user));
      }
    } catch (error) {
      console.error('Failed to load user from localStorage', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  dispatch(initializeAuth());
};