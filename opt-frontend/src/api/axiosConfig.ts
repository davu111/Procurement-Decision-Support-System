import axios from "axios";
import KeycloakService from "./KeycloakService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor - Add Authorization token
api.interceptors.request.use(
  (config) => {
    const token = KeycloakService.getInstance().getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (response.data.success || response.data.code === 200)
      return response.data;
    return Promise.reject(new Error(response.data.message));
  },
  (error) => {
    const message = error.response?.data?.message || "Lỗi kết nối server";
    return Promise.reject(new Error(message));
  },
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
