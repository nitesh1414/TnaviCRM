import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tnavicrm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('tnavicrm_token');
      localStorage.removeItem('tnavicrm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const get = (url, params) => api.get(url, { params }).then(r => r.data);
export const post = (url, body) => api.post(url, body).then(r => r.data);
export const put = (url, body) => api.put(url, body).then(r => r.data);
export const patch = (url, body) => api.patch(url, body).then(r => r.data);
export const del = (url) => api.delete(url).then(r => r.data);
export default api;
