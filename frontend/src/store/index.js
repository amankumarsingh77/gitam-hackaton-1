import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import chaptersReducer from './slices/chaptersSlice';
import aiReducer from './slices/aiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    chapters: chaptersReducer,
    ai: aiReducer,
  },
});

export default store; 