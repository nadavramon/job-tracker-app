import api from './api';
import { UserProfileResponse, UpdateProfileRequest } from '@/types';

export async function getProfile(): Promise<UserProfileResponse> {
    const response = await api.get<UserProfileResponse>('/me');
    return response.data;
}

export async function updateProfile(data: UpdateProfileRequest) : Promise<UserProfileResponse> {
    const response = await api.patch<UserProfileResponse>('/me', data);
    return response.data;
}

export async function deleteAccount(): Promise<void> {
    await api.delete('/me');
}