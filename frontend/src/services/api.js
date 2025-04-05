import axios from 'axios';


const API = axios.create({
  baseURL: 'https://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});


API.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const authAPI = {
  
  register: (userData) => 
    API.post('/auth/register', userData),
  
  login: (credentials) => 
    API.post('/auth/login', credentials),
  
  
  getProfile: (userId) => 
    API.get(`/auth/profile/${userId}`),
  
  updateProfile: (userId, profileData) => 
    API.put(`/auth/profile/${userId}`, profileData),
  
  updateAvatar: (userId, avatarUrl) => 
    API.put(`/auth/profile/${userId}/avatar`, { avatar_url: avatarUrl }),
  
  
  getProgress: (userId, subject, grade) => 
    API.get(`/auth/profile/${userId}/progress?subject=${subject}&grade=${grade}`),
  
  getStreak: (userId) => 
    API.get(`/auth/profile/${userId}/streak`),
};


export const chaptersAPI = {
  
  getChaptersBySubject: (subject, grade) => 
    API.get(`/chapters?subject=${subject}&grade=${grade}`),
  
  getChapterById: (chapterId) => 
    API.get(`/chapters/${chapterId}`),
  
  
  createChapter: (chapterData) => 
    API.post('/chapters', chapterData),
  
  updateChapter: (chapterId, chapterData) => 
    API.put(`/chapters/${chapterId}`, chapterData),
  
  deleteChapter: (chapterId) => 
    API.delete(`/chapters/${chapterId}`),
  
  
  generateChapter: (data) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('prompt', data.prompt);
    formData.append('subject', data.subject);
    formData.append('grade', data.grade);
    
    // Add file if it exists
    if (data.contextFile) {
      formData.append('contextFile', data.contextFile);
    }
    
    return API.post('/chapters/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  generateMemes: (chapterId, topic) => 
    API.post(`/chapters/${chapterId}/memes`, { topic }),
  
  generateQuiz: (chapterId) => 
    API.post(`/chapters/${chapterId}/quiz`),
  
  
  createCustomChapter: (chapterData) => 
    API.post('/chapters', chapterData),
  
  getCustomChapters: () => 
    API.get('/chapters'),
    
  
  getCustomLessonsByChapter: (chapterId) =>
    API.get(`/chapters/${chapterId}/custom-lessons`),
  
  getLessonById: (lessonId) =>
    API.get(`/chapters/lessons/${lessonId}`),
  
  
  getQuizById: (quizId) =>
    API.get(`/chapters/quizzes/${quizId}`),
    
  submitQuizAnswers: (quizId, answers) =>
    API.post('/chapters/quizzes/submit', { 
      quiz_id: quizId, 
      answers: answers 
    }),
    
  getQuizzesByChapter: (chapterId) =>
    API.get(`/chapters/${chapterId}/quizzes`),
    
  getQuizQuestions: (quizId) =>
    API.get(`/chapters/quizzes/${quizId}/questions`),
};


export const achievementsAPI = {
  
  getAllAchievements: () => 
    API.get('/achievements'),
  
  getAchievementById: (achievementId) => 
    API.get(`/achievements/${achievementId}`),
  
  
  getUserAchievements: () => 
    API.get('/achievements/user'),
  
  
  createAchievement: (achievementData) => 
    API.post('/achievements/admin', achievementData),
  
  updateAchievement: (achievementId, achievementData) => 
    API.put(`/achievements/admin/${achievementId}`, achievementData),
  
  deleteAchievement: (achievementId) => 
    API.delete(`/achievements/admin/${achievementId}`),
  
  awardAchievement: (userId, achievementId) => 
    API.post('/achievements/admin/award', { user_id: userId, achievement_id: achievementId }),
};

export const chatbotAPI = {
  // Send a message to the chatbot
  sendMessage: (prompt) => 
    API.post('/chatbot/chat', { prompt }),
  
  // Get chat history
  getChatHistory: () => 
    API.get('/chatbot/history'),
};

export default API; 