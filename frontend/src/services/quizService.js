import API from './api';

/**
 * Service for handling quiz-related API calls
 */
export const quizService = {
    /**
     * Get all quizzes for a chapter
     * @param {string} chapterId - The ID of the chapter
     * @returns {Promise} - The API response
     */
    getQuizzesByChapter: (chapterId) => 
        API.get(`/chapters/${chapterId}/quizzes`),
    
    /**
     * Get a quiz by ID
     * @param {string} quizId - The ID of the quiz
     * @returns {Promise} - The API response
     */
    getQuizById: (quizId) =>
        API.get(`/chapters/quizzes/${quizId}`),
    
    /**
     * Generate a new quiz for a chapter
     * @param {string} chapterId - The ID of the chapter
     * @returns {Promise} - The API response
     */
    generateQuiz: (chapterId) =>
        API.post(`/chapters/${chapterId}/quiz`),
    
    /**
     * Submit quiz answers
     * @param {string} quizId - The ID of the quiz
     * @param {Array} answers - Array of answer objects with question_id and answer
     * @returns {Promise} - The API response
     */
    submitQuizAnswers: (quizId, answers) =>
        API.post(`/chapters/quizzes/submit`, {
            quiz_id: quizId,
            answers: answers.map(ans => ({
                question_id: ans.questionId || ans.question_id,
                answer: ans.answer
            }))
        })
};

export default quizService; 