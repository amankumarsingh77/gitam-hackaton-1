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

// Async thunk for sending a chat message to the chatbot API
export const getAIResponse = createAsyncThunk(
  'ai/getResponse',
  async (message, thunkAPI) => {
    try {
      // Connect to the actual chatbot API endpoint
      const response = await API.post('/chatbot/chat', { prompt: message });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to get AI response');
    }
  }
);

// Async thunk for fetching chat history
export const fetchChatHistory = createAsyncThunk(
  'ai/fetchChatHistory',
  async (_, thunkAPI) => {
    try {
      const response = await API.get('/chatbot/history');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch chat history');
    }
  }
);

const initialState = {
  isGenerating: false,
  generatedChapter: null,
  error: null,
  chatHistory: [],
  isLoadingChat: false,
  isLoadingHistory: false,
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
        // Add an error message to the chat
        state.chatHistory.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          isError: true
        });
      })
      .addCase(fetchChatHistory.pending, (state) => {
        state.isLoadingHistory = true;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        
        // Clear existing history
        state.chatHistory = [];
        
        // Transform the backend chat history format to our frontend format
        // Each entry in the API response contains both a prompt and a response
        // We need to create separate entries for each
        const chatEntries = [];
        
        // Process the chat history in reverse order (oldest first)
        const sortedHistory = [...action.payload].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        
        sortedHistory.forEach(entry => {
          // Add user message
          if (entry.prompt) {
            chatEntries.push({
              role: 'user',
              content: entry.prompt,
              timestamp: new Date(entry.created_at)
            });
          }
          
          // Add bot response
          if (entry.response) {
            chatEntries.push({
              role: 'assistant',
              content: entry.response,
              timestamp: new Date(entry.created_at)
            });
          }
        });
        
        state.chatHistory = chatEntries;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.payload || 'Failed to fetch chat history';
      });
  },
});

export const { 
  clearGeneratedChapter, 
  addChatMessage, 
  clearChatHistory 
} = aiSlice.actions;

export default aiSlice.reducer; 