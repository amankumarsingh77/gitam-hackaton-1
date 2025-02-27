import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chaptersAPI } from '../../services/api';

// Async thunks for chapters
export const fetchChaptersBySubject = createAsyncThunk(
  'chapters/fetchBySubject',
  async ({ subject, grade }, thunkAPI) => {
    try {
      const response = await chaptersAPI.getChaptersBySubject(subject, grade);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to fetch chapters';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const fetchChapterById = createAsyncThunk(
  'chapters/fetchById',
  async (chapterId, thunkAPI) => {
    try {
      const response = await chaptersAPI.getChapterById(chapterId);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to fetch chapter';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const createChapter = createAsyncThunk(
  'chapters/create',
  async (chapterData, thunkAPI) => {
    try {
      const response = await chaptersAPI.createChapter(chapterData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to create chapter';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const updateChapter = createAsyncThunk(
  'chapters/update',
  async ({ chapterId, chapterData }, thunkAPI) => {
    try {
      const response = await chaptersAPI.updateChapter(chapterId, chapterData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to update chapter';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteChapter = createAsyncThunk(
  'chapters/delete',
  async (chapterId, thunkAPI) => {
    try {
      await chaptersAPI.deleteChapter(chapterId);
      return chapterId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to delete chapter';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const generateChapterWithAI = createAsyncThunk(
  'chapters/generateWithAI',
  async ({ prompt, subject, grade }, thunkAPI) => {
    try {
      const response = await chaptersAPI.generateChapter({ prompt, subject, grade });
      return response.data;
    } catch (error) {
      // Ensure we're returning a string, not an object
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to generate chapter';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const generateMemes = createAsyncThunk(
  'chapters/generateMemes',
  async ({ chapterId, topic }, thunkAPI) => {
    try {
      const response = await chaptersAPI.generateMemes(chapterId, topic);
      return { chapterId, memes: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to generate memes';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const generateQuiz = createAsyncThunk(
  'chapters/generateQuiz',
  async (chapterId, thunkAPI) => {
    try {
      const response = await chaptersAPI.generateQuiz(chapterId);
      return { chapterId, quiz: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to generate quiz';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const fetchCustomChapters = createAsyncThunk(
  'chapters/fetchCustom',
  async (_, thunkAPI) => {
    try {
      const response = await chaptersAPI.getCustomChapters();
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch custom chapters');
    }
  }
);

export const createCustomChapter = createAsyncThunk(
  'chapters/createCustom',
  async (chapterData, thunkAPI) => {
    try {
      const response = await chaptersAPI.createCustomChapter(chapterData);
      return response.data;
    } catch (error) {
      // Ensure we're returning a string, not an object
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to create custom chapter';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const fetchCustomLessonsByChapter = createAsyncThunk(
  'chapters/fetchCustomLessons',
  async (chapterId, thunkAPI) => {
    try {
      const response = await chaptersAPI.getCustomLessonsByChapter(chapterId);
      return { chapterId, lessons: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to fetch custom lessons';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const fetchLessonById = createAsyncThunk(
  'chapters/fetchLessonById',
  async (lessonId, thunkAPI) => {
    try {
      const response = await chaptersAPI.getLessonById(lessonId);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data) || 
                          error.message || 
                          'Failed to fetch lesson';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Sample initial state with mock data
const initialState = {
  chapters: [],
  currentChapterId: null,
  currentLessonId: null,
  isLoading: false,
  error: null,
  generatedChapter: null,
  customLessons: [],
};

const chaptersSlice = createSlice({
  name: 'chapters',
  initialState,
  reducers: {
    setCurrentChapter: (state, action) => {
      state.currentChapterId = action.payload;
    },
    setCurrentLesson: (state, action) => {
      state.currentLessonId = action.payload;
    },
    updateChapterProgress: (state, action) => {
      const { chapterId, progress } = action.payload;
      const chapter = state.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        chapter.progress = progress;
      }
    },
    clearGeneratedChapter: (state) => {
      state.generatedChapter = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chapters by subject
      .addCase(fetchChaptersBySubject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChaptersBySubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chapters = action.payload || [];
      })
      .addCase(fetchChaptersBySubject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch chapters';
      })
      
      // Fetch chapter by ID
      .addCase(fetchChapterById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChapterById.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.chapters.findIndex(ch => ch.id === action.payload.id);
          if (index !== -1) {
            state.chapters[index] = action.payload;
          } else {
            state.chapters.push(action.payload);
          }
          state.currentChapterId = action.payload.id;
        }
      })
      .addCase(fetchChapterById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch chapter';
      })
      
      // Create chapter
      .addCase(createChapter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChapter.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.chapters.push(action.payload);
        }
      })
      .addCase(createChapter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create chapter';
      })
      
      // Update chapter
      .addCase(updateChapter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateChapter.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.chapters.findIndex(ch => ch.id === action.payload.id);
          if (index !== -1) {
            state.chapters[index] = action.payload;
          }
        }
      })
      .addCase(updateChapter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update chapter';
      })
      
      // Delete chapter
      .addCase(deleteChapter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteChapter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chapters = state.chapters.filter(ch => ch.id !== action.payload);
        if (state.currentChapterId === action.payload) {
          state.currentChapterId = null;
        }
      })
      .addCase(deleteChapter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete chapter';
      })
      
      // Generate chapter with AI
      .addCase(generateChapterWithAI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateChapterWithAI.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedChapter = action.payload;
      })
      .addCase(generateChapterWithAI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to generate chapter';
      })
      
      // Generate memes
      .addCase(generateMemes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateMemes.fulfilled, (state, action) => {
        state.isLoading = false;
        const { chapterId, memes } = action.payload;
        const chapter = state.chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          // Update lessons with memes
          chapter.lessons.forEach((lesson, index) => {
            if (memes[index]) {
              lesson.memeUrl = memes[index].url;
            }
          });
        }
      })
      .addCase(generateMemes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to generate memes';
      })
      
      // Generate quiz
      .addCase(generateQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        const { chapterId, quiz } = action.payload;
        const chapter = state.chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          chapter.quiz = quiz;
        }
      })
      .addCase(generateQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to generate quiz';
      })
      
      // Fetch custom chapters
      .addCase(fetchCustomChapters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomChapters.fulfilled, (state, action) => {
        state.isLoading = false;
        // Merge custom chapters with existing chapters
        const existingIds = state.chapters.map(ch => ch.id);
        const newChapters = action.payload.filter(ch => !existingIds.includes(ch.id));
        state.chapters = [...state.chapters, ...newChapters];
      })
      .addCase(fetchCustomChapters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch custom chapters';
      })
      
      // Create custom chapter
      .addCase(createCustomChapter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCustomChapter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chapters.push(action.payload);
      })
      .addCase(createCustomChapter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create custom chapter';
      })
      
      // Fetch custom lessons by chapter
      .addCase(fetchCustomLessonsByChapter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomLessonsByChapter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customLessons = action.payload.lessons || [];
        
        // Update the chapter with custom lessons if it exists
        const chapter = state.chapters.find(ch => ch.chapter_id === action.payload.chapterId);
        if (chapter) {
          chapter.customLessons = action.payload.lessons;
        }
      })
      .addCase(fetchCustomLessonsByChapter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch custom lessons';
      })
      
      // Fetch lesson by ID
      .addCase(fetchLessonById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.chapters.findIndex(ch => ch.id === action.payload.chapter_id);
          if (index !== -1) {
            state.chapters[index].lessons.push(action.payload);
          }
        }
      })
      .addCase(fetchLessonById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch lesson';
      });
  },
});

export const { 
  setCurrentChapter, 
  setCurrentLesson, 
  updateChapterProgress,
  clearGeneratedChapter,
  clearError
} = chaptersSlice.actions;

export default chaptersSlice.reducer; 