import { api } from '../../services/api';

const unwrap = (response) => response.data?.data;

export const registerApi = (payload) => api.post('/auth/register', payload).then(unwrap);

export const loginApi = (payload) => api.post('/auth/login', payload).then(unwrap);
