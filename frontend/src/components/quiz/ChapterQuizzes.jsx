import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { chaptersAPI } from '../../services/api';

const ChapterQuizzes = ({ chapterId }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            console.log("chapterId", chapterId);
            if (!chapterId) return;

            setIsLoading(true);
            setError(null);

            try {
                // Use chaptersAPI service to fetch real data from the API
                const response = await chaptersAPI.getQuizzesByChapter(chapterId);

                console.log("response", response.data.data);

                // Handle the new response structure
                if (response.data && response.data.data.quizzes) {
                    // The API now returns quizzes with their questions
                    setQuizzes(response.data.data.quizzes);
                } else if (Array.isArray(response.data)) {
                    // Handle case where API might return an array directly
                    setQuizzes(response.data);
                } else {
                    // Default to empty array if response format is unexpected
                    setQuizzes([]);
                    console.error('Unexpected response format:', response.data);
                }
            } catch (err) {
                console.error('Error fetching quizzes:', err);
                setError(err.response?.data?.message || 'Failed to load quizzes. Please try again later.');
                // Initialize with empty array on error
                setQuizzes([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [chapterId]);

    const handleStartQuiz = (quizId) => {
        navigate(`/chapters/${chapterId}/quizzes/${quizId}`);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!quizzes || quizzes.length === 0) {
        return (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg my-4">
                <p className="text-amber-700">No quizzes available for this chapter yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 my-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Chapter Quizzes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                    <motion.div
                        key={quiz.quiz_id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden"
                    >
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-medium text-lg text-slate-800">{quiz.title}</h3>
                        </div>

                        <div className="p-6">
                            <p className="text-slate-600 mb-4">{quiz.description}</p>

                            <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {quiz.time_limit ? `${Math.floor(quiz.time_limit / 60)} minutes` : 'No time limit'}
                                </span>

                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    {quiz.questions ? quiz.questions.length : 0} questions
                                </span>
                            </div>

                            <button
                                onClick={() => handleStartQuiz(quiz.quiz_id)}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                            >
                                <span className="mr-2">Start Quiz</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ChapterQuizzes; 