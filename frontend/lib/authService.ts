import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

//Sends POST to /auth/login with identifier + password
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

//Sends POST to /auth/register with email + username + password
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};