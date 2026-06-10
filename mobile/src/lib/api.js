import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded for production — Constants.expoConfig is unreliable in EAS builds
const API_URL = 'https://callby.vercel.app';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(err);
  }
);

export default api;
