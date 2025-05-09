import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, logout } = useAuth(); // Get token and logout from AuthContext
  const navigate = useNavigate();

  // Create an Axios instance.
  // The global axios instance already has the Authorization header set by AuthContext if a token exists.
  // However, creating a local instance or re-affirming the header can be done if needed,
  // but for now, we'll rely on the global default.
  const apiClient = axios.create({
    baseURL: 'http://localhost:4000', // Your API base URL
  });

  // Interceptor to handle token and errors consistently
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`[useApi] Interceptor: Preparing request to ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('[useApi] Interceptor: Token found, Authorization header set.');
      } else {
        console.log('[useApi] Interceptor: No token found.');
      }
      return config;
    },
    (err) => {
      console.error('[useApi] Interceptor: Request error:', err);
      return Promise.reject(err);
    }
  );

  const request = useCallback(async (method, url, data = null, params = null) => {
    const fullUrl = `${apiClient.defaults.baseURL}${url}`;
    console.log(`[useApi] Request: Initiating ${method.toUpperCase()} request to ${fullUrl}`, { data, params });
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient({
        method,
        url, // apiClient uses baseURL + url
        data,
        params,
      });
      console.log(`[useApi] Request: Success for ${method.toUpperCase()} ${fullUrl}`, response.data);
      setLoading(false);

      // Show success toast for relevant methods
      const successMessage = response.data?.message; // Use message from API response if available
      if (method === 'post') {
        toast.success(successMessage || 'Item created successfully!');
      } else if (method === 'put') {
        toast.success(successMessage || 'Item updated successfully!');
      } else if (method === 'delete') {
        toast.success(successMessage || 'Item deleted successfully!');
      }
      // For login/register, success message is handled in AuthContext or component
      // We can add more specific messages based on URL patterns if needed

      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || err.message || 'An API error occurred';
      const errorStatus = err.response?.status;
      setError({ message: errorMessage, status: errorStatus });
      console.error(`[useApi] Request: Failed for ${method.toUpperCase()} ${fullUrl}. Status: ${errorStatus}. Message: ${errorMessage}`, err.response || err);

      // Show error toast for relevant methods (excluding GET by default)
      // For login/register, error message is handled in AuthContext or component
      if (method !== 'get' && !(url.includes('/api/auth/login') || url.includes('/api/auth/register'))) {
         toast.error(errorMessage);
      }
      
      if (errorStatus === 401 || errorStatus === 403) {
        console.log(`[useApi] Request: Auth error (${errorStatus}), logging out and redirecting to login.`);
        if (logout) {
          logout();
        }
        navigate('/login', { replace: true });
      }
      // Re-throw a simplified error object for the component to catch if needed
      throw { message: errorMessage, status: errorStatus, originalError: err };
    }
  }, [token, logout, navigate, apiClient.defaults.baseURL]);

  const get = useCallback((url, params = null) => {
    console.log(`[useApi] GET: Called for URL: ${url}`, params);
    return request('get', url, null, params);
  }, [request]);
  const post = useCallback((url, data) => {
    console.log(`[useApi] POST: Called for URL: ${url}`, data);
    return request('post', url, data);
  }, [request]);
  const put = useCallback((url, data) => {
    console.log(`[useApi] PUT: Called for URL: ${url}`, data);
    return request('put', url, data);
  }, [request]);
  const del = useCallback((url) => { // 'delete' is a reserved keyword
    console.log(`[useApi] DELETE: Called for URL: ${url}`);
    return request('delete', url);
  }, [request]);

  return { get, post, put, del, loading, error, setError };
};

export default useApi;