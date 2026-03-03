import api from './api';
import { Application, PagedResponse, StatsResponse } from '@/types';

export const getApplications = async (
  page = 0,
  size = 20,
  sort = 'appliedDate,desc',
): Promise<PagedResponse<Application>> => {
  const response = await api.get<PagedResponse<Application>>('/applications', {
    params: { page, size, sort },
  });
  return response.data;
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

export const getStats = async (): Promise<StatsResponse> => {
  const response = await api.get<StatsResponse>('/applications/stats');
  return response.data;
};