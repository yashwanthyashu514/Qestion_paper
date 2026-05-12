import axios from 'axios';

// ── Base URL Configuration ──────────────────────────────────────────────────
// In LOCAL DEV: leave empty — Vite's proxy forwards /api/* to localhost:5000
// In PRODUCTION (Vercel): set VITE_API_URL in Vercel dashboard OR in .env file
//   to your Render backend URL e.g. https://qpg-backend-5h72.onrender.com
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_URL
});

// Global loading callbacks
let loadingCallback = (isLoading) => {};
export const setLoadingCallback = (cb) => { loadingCallback = cb; };

// Add a request interceptor to attach the JWT token to every request
api.interceptors.request.use((config) => {
    loadingCallback(true);
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    loadingCallback(false);
    return Promise.reject(error);
});

// Add a response interceptor to handle token expiry globally
api.interceptors.response.use(
    (response) => {
        loadingCallback(false);
        return response;
    },
    (error) => {
        loadingCallback(false);
        if (error.response && error.response.status === 401) {
            // Token expired or invalid — clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
export { API_URL };
