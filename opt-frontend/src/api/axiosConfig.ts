import axios from 'axios';

const inventoryApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

inventoryApi.interceptors.response.use(
  (response) => {
    if (response.data.success) return response.data;
    return Promise.reject(new Error(response.data.message));
  },
  (error) => {
    const message = error.response?.data?.message || 'Lỗi kết nối server';
    return Promise.reject(new Error(message));
  }
);

export default inventoryApi;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
