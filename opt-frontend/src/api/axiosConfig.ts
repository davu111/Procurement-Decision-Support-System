import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => {
    if (response.data.success || response.data.code === 200)
      return response.data;
    return Promise.reject(new Error(response.data.message));
  },
  (error) => {
    const message = error.response?.data?.message || "Lỗi kết nối server";
    return Promise.reject(error); // ✅ giữ nguyên axios error
  },
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
