import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const generateChapter = createAsyncThunk(
  'ai/generateChapter',
  async (topic, thunkAPI) => {
    try {
      // This would connect to your backend API, which would then call OpenAI
      const response = await API.post('/api/ai/generate-chapter', { topic });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for AI chat
export const getAIResponse = createAsyncThunk(
  'ai/getResponse',
  async (message, thunkAPI) => {
    try {
      // This would connect to your backend API, which would then call OpenAI
      // For now, we'll simulate a response since the endpoint isn't specified in the testcurl.md
      // In a real app, you would use an actual API endpoint
      
      // Simulated API call
      // const response = await API.post('/api/ai/chat', { message });
      
      // For demo purposes, return a simulated response
      return {
        response: `This is a simulated AI response to: "${message}". In a real app, this would come from the backend API.`
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to get AI response');
    }
  }
);

const initialState = {
  isGenerating: false,
  generatedChapter: null,
  error: null,
  chatHistory: [],
  isLoadingChat: false,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearGeneratedChapter: (state) => {
      state.generatedChapter = null;
    },
    addChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateChapter.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateChapter.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedChapter = action.payload;
      })
      .addCase(generateChapter.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload || 'Failed to generate chapter';
      })
      .addCase(getAIResponse.pending, (state) => {
        state.isLoadingChat = true;
      })
      .addCase(getAIResponse.fulfilled, (state, action) => {
        state.isLoadingChat = false;
        state.chatHistory.push({
          role: 'assistant',
          content: action.payload.response,
        });
      })
      .addCase(getAIResponse.rejected, (state, action) => {
        state.isLoadingChat = false;
        state.error = action.payload || 'Failed to get AI response';
      });
  },
});

export const { 
  clearGeneratedChapter, 
  addChatMessage, 
  clearChatHistory 
} = aiSlice.actions;

export default aiSlice.reducer; 