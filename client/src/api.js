import axios from 'axios';

// The base URL for the API
// In development, this usually points to localhost:5000
// In production, this points to your Render backend URL
const API_URL = import.meta.env.VITE_API_URL || 'https://qpg-backend-5h72.onrender.com';

const api = axios.create({
    baseURL: API_URL
});

// Add a request interceptor to attach the JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
export { API_URL };
