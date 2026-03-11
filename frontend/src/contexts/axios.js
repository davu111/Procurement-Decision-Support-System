import axios from 'axios';
import keycloak from './keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// // Request interceptor - Thêm token vào mọi request
// api.interceptors.request.use(
//   (config) => {
//     if (keycloak.token) {
//       config.headers.Authorization = `Bearer ${keycloak.token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor - Xử lý lỗi
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Nếu token hết hạn (401) và chưa retry
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // Refresh token
//         await keycloak.updateToken(5);
//         originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         // Nếu refresh thất bại, logout
//         keycloak.logout();
//         return Promise.reject(refreshError);
//       }
//     }

//     // Cải thiện error message
//     if (error.response) {
//       // Lấy message từ backend response
//       const message = error.response.data?.message || 
//                      error.response.data?.error || 
//                      error.response.statusText ||
//                      'Have an error';
      
//       // Tạo error object với message rõ ràng
//       const enhancedError = new Error(message);
//       enhancedError.response = error.response;
//       enhancedError.status = error.response.status;
      
//       return Promise.reject(enhancedError);
//     }

//     return Promise.reject(error);
//   }
// );


export default api;