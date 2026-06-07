import Cookies from 'js-cookie';

export const getToken = () => Cookies.get('token');

export const setToken = (token) => Cookies.set('token', token, { expires: 7 });

export const removeToken = () => Cookies.remove('token');

export const isAuthenticated = () => !!getToken();
