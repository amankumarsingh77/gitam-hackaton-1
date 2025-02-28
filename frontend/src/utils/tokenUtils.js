/**
 * Token management utilities
 */

/**
 * Store authentication token and user data
 * @param {string} token - JWT token
 * @param {object} user - User data object
 * @param {boolean} rememberMe - Whether to persist across sessions
 */
export const storeAuthData = (token, user, rememberMe = false) => {
  if (!token || !user) return;
  
  // Clear any existing data first
  clearAuthData();
  
  // Store based on rememberMe preference
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
};

/**
 * Get the stored authentication token
 * @returns {string|null} The stored token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
};

/**
 * Get the stored user data
 * @returns {object|null} The stored user data or null if not found
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!getToken() && !!getUser();
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

export default {
  storeAuthData,
  getToken,
  getUser,
  isAuthenticated,
  clearAuthData
}; 