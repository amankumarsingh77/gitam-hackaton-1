import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Async thunks for user progress
export const fetchUserProgress = createAsyncThunk(
  'user/fetchProgress',
  async ({ userId, subject, grade }, thunkAPI) => {
    try {
      const response = await authAPI.getProgress(userId, subject, grade);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch progress');
    }
  }
);

export const fetchUserStreak = createAsyncThunk(
  'user/fetchStreak',
  async (userId, thunkAPI) => {
    try {
      const response = await authAPI.getStreak(userId);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch streak');
    }
  }
);

const initialState = {
  xp: 150,
  level: 2,
  streak: 3,
  completedLessons: ['lesson1', 'lesson2', 'lesson3'],
  completedQuizzes: ['quiz1', 'quiz2'],
  badges: [],
  lastActive: new Date().toISOString(),
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addXp: (state, action) => {
      state.xp += action.payload;
      // Level up logic (100 XP per level)
      const newLevel = Math.floor(state.xp / 100) + 1;
      if (newLevel > state.level) {
        state.level = newLevel;
        // Could dispatch a notification here
      }
    },
    
    incrementStreak: (state) => {
      state.streak += 1;
    },
    
    resetStreak: (state) => {
      state.streak = 0;
    },
    
    completeLesson: (state, action) => {
      const lessonId = action.payload;
      if (!state.completedLessons.includes(lessonId)) {
        state.completedLessons.push(lessonId);
        // Add XP for completing a lesson
        state.xp += 20;
        // Level up logic
        const newLevel = Math.floor(state.xp / 100) + 1;
        if (newLevel > state.level) {
          state.level = newLevel;
        }
      }
    },
    
    completeQuiz: (state, action) => {
      const { quizId, score } = action.payload;
      if (!state.completedQuizzes.includes(quizId)) {
        state.completedQuizzes.push(quizId);
        // Add XP based on quiz score
        state.xp += Math.floor(score * 30);
        // Level up logic
        const newLevel = Math.floor(state.xp / 100) + 1;
        if (newLevel > state.level) {
          state.level = newLevel;
        }
      }
    },
    
    updateLastActive: (state) => {
      state.lastActive = new Date().toISOString();
    },
    
    earnBadge: (state, action) => {
      const badge = action.payload;
      if (!state.badges.some(b => b.id === badge.id)) {
        state.badges.push(badge);
        // Add XP for earning a badge
        state.xp += 50;
        // Level up logic
        const newLevel = Math.floor(state.xp / 100) + 1;
        if (newLevel > state.level) {
          state.level = newLevel;
        }
      }
    },
    
    resetUserProgress: (state) => {
      return initialState;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch progress cases
      .addCase(fetchUserProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update state with progress data from API
        const { xp, level, completedLessons, completedQuizzes, badges } = action.payload;
        state.xp = xp || state.xp;
        state.level = level || state.level;
        state.completedLessons = completedLessons || state.completedLessons;
        state.completedQuizzes = completedQuizzes || state.completedQuizzes;
        state.badges = badges || state.badges;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch progress';
      })
      // Fetch streak cases
      .addCase(fetchUserStreak.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStreak.fulfilled, (state, action) => {
        state.isLoading = false;
        state.streak = action.payload.streak;
        state.lastActive = action.payload.lastActive;
      })
      .addCase(fetchUserStreak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch streak';
      });
  }
});

export const { 
  addXp, 
  incrementStreak, 
  resetStreak, 
  completeLesson, 
  completeQuiz,
  updateLastActive,
  earnBadge,
  resetUserProgress,
  clearError
} = userSlice.actions;

export default userSlice.reducer; 