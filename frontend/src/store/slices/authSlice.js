import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { storeAuthData, getToken, getUser, clearAuthData, isAuthenticated as checkAuth } from '../../utils/tokenUtils';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const response = await authAPI.login(credentials);
      
      // We'll handle token storage in the component based on rememberMe preference
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      // Transform the data to match the backend API
      const transformedData = {
        first_name: userData.name.split(' ')[0],
        last_name: userData.name.split(' ').slice(1).join(' '),
        email: userData.email,
        password: userData.password,
        grade: userData.grade || 10 // Default to grade 10 if not provided
      };
      
      const response = await authAPI.register(transformedData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId, thunkAPI) => {
    try {
      const response = await authAPI.getProfile(userId);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, profileData }, thunkAPI) => {
    try {
      // Transform the data to match the backend API
      const transformedData = {
        first_name: profileData.name ? profileData.name.split(' ')[0] : undefined,
        last_name: profileData.name ? profileData.name.split(' ').slice(1).join(' ') : undefined,
        email: profileData.email,
        grade: profileData.grade
      };
      
      const response = await authAPI.updateProfile(userId, transformedData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateUserAvatar = createAsyncThunk(
  'auth/updateAvatar',
  async ({ userId, avatarUrl }, thunkAPI) => {
    try {
      const response = await authAPI.updateAvatar(userId, avatarUrl);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update avatar');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      // Use our utility function to clear auth data
      clearAuthData();
      return null;
    } catch (error) {
      return thunkAPI.rejectWithValue('Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, thunkAPI) => {
    try {
      // Use our utility functions to check auth status
      const token = getToken();
      const user = getUser();
      
      if (!token || !user) {
        return thunkAPI.rejectWithValue('No token or user data found');
      }
      
      // Return the stored user data and token
      return { user, token };
    } catch (error) {
      // If there's an error, clear auth data
      clearAuthData();
      return thunkAPI.rejectWithValue('Invalid user data');
    }
  }
);

// Initialize state using our utility functions
const token = getToken();
const user = getUser();

const initialState = {
  user: user,
  token: token,
  isAuthenticated: checkAuth(),
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Registration successful, but user still needs to login
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      })
      // Fetch profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch profile';
      })
      // Update profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update profile';
      })
      // Update avatar cases
      .addCase(updateUserAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update avatar';
      })
      // Check auth status cases
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer; 