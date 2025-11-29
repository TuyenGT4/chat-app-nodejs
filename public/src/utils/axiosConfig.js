import axios from "axios";

// Tạo axios instance với config mặc định
const api = axios.create({
  baseURL: "https://chat-app-nodejs-uxeq.onrender.com", // URL backend của bạn
});

// Interceptor để tự động thêm token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chat-app-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response errors (token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem("chat-app-token");
      localStorage.removeItem(process.env.REACT_APP_LOCALHOST_KEY);

      // Chuyển về trang login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
