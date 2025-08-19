// src/store/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../service/userService';
import { loginSuccess, loginFailure, loginStart } from './authSlice';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { dispatch }) => {
    try {
      dispatch(loginStart());
      const user = await loginUser(email, password);
      localStorage.setItem('token', 'mock-jwt-token');
      dispatch(loginSuccess(user));
      return user;
    } catch (error) {
      dispatch(loginFailure(error.message));
      throw error;
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, { dispatch }) => {
    try {
      const user = await registerUser(userData);
      return user;
    } catch (error) {
      throw error;
    }
  }
);