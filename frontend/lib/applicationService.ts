import api from './api';
import { Application } from '@/types';

export const getApplications = async (): Promise<Application[]> => {
  const response = await api.get<{ content: Application[] }>('/applications');
  return response.data.content;
};

export const getApplication = async (id: string): Promise<Application> => {
  const response = await api.get<Application>(`/applications/${id}`);
  return response.data;
};

export const createApplication = async (data: Omit<Application, 'id'>): Promise<Application> => {
  const response = await api.post<Application>('/applications', data);
  return response.data;
};

export const updateApplication = async (id: string, data: Partial<Application>): Promise<Application> => {
  const response = await api.patch<Application>(`/applications/${id}`, data);
  return response.data;
};

export const deleteApplication = async (id: string): Promise<void> => {
  await api.delete(`/applications/${id}`);
};