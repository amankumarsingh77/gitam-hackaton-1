import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import QuizQuestion from '../components/quiz/QuizQuestion';
import QuizHeader from '../components/quiz/QuizHeader';
import QuizResults from '../components/quiz/QuizResults';
import { chaptersAPI } from '../services/api';

function QuizView() {
    const { chapterId, quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch quiz and questions
    useEffect(() => {
        const fetchQuizData = async () => {
            if (!chapterId || !quizId) return;

            setIsLoading(true);
            setError(null);

            try {
                // Use chaptersAPI service to fetch real data from the API
                const quizResponse = await chaptersAPI.getQuizById(quizId);

                // Fetch quiz questions using the API
                const questionsResponse = await chaptersAPI.getQuizQuestions(quizId);

                // Ensure quiz data is valid
                if (!quizResponse.data.data || typeof quizResponse.data.data !== 'object') {
                    throw new Error('Invalid quiz data received');
                }

                // Process questions data based on the API response structure
                let questionsData = [];

                // Check if the response has data.questions array structure
                if (questionsResponse.data.data && questionsResponse.data.data.questions &&
                    Array.isArray(questionsResponse.data.data.questions)) {
                    questionsData = questionsResponse.data.data.questions;
                }
                // Check if the response data is directly an array
                else if (Array.isArray(questionsResponse.data.data)) {
                    questionsData = questionsResponse.data.data;
                }
                // Check if the response has a data object that contains the questions
                else if (questionsResponse.data.data && typeof questionsResponse.data.data === 'object') {
                    // If we have a nested data structure with questions array
                    if (Array.isArray(questionsResponse.data.data.questions)) {
                        questionsData = questionsResponse.data.data.questions;
                    } else {
                        // Try to extract questions from the data object
                        const questionsArray = Object.values(questionsResponse.data.data).filter(item =>
                            item && typeof item === 'object' && item.question_id
                        );
                        questionsData = questionsArray.length > 0 ? questionsArray : [];
                    }
                }

                console.log('Processed questions data:', questionsData);

                setQuiz(quizResponse.data);
                setQuestions(questionsData);
                setTimeLeft(quizResponse.data.time_limit || 600);
            } catch (err) {
                console.error('Error fetching quiz data:', err);
                setError(err.response?.data?.message || 'Failed to load quiz. Please try again later.');
                // Initialize with empty arrays on error
                setQuiz(null);
                setQuestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizData();
    }, [chapterId, quizId]);

    // Timer countdown
    useEffect(() => {
        if (!quiz || quizCompleted || isLoading) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    setQuizCompleted(true);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz, quizCompleted, isLoading]);

    // Store the index of the selected option instead of the option text
    const handleSelectAnswer = (questionId, index) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: index
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setQuizCompleted(true);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        setQuizCompleted(true);

        try {
            // Format answers according to the API requirements
            // The API expects an array of objects with question_id and answer
            const formattedAnswers = Object.keys(answers).map(questionId => {
                const question = questions.find(q => q.question_id === questionId);
                if (question && typeof answers[questionId] === 'number' &&
                    Array.isArray(question.options) && question.options[answers[questionId]]) {
                    return {
                        question_id: questionId,
                        answer: question.options[answers[questionId]]
                    };
                }
                return null;
            }).filter(answer => answer !== null);

            // Use chaptersAPI service to submit quiz answers
            await chaptersAPI.submitQuizAnswers(quizId, formattedAnswers);
        } catch (err) {
            console.error('Error submitting quiz:', err);
        }
    };

    const calculateResults = () => {
        let correctCount = 0;
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach(question => {
            const points = question.points || 10; // Default to 10 points if not specified
            totalPoints += points;

            // Get the selected option index
            const selectedIndex = answers[question.question_id];

            // Convert index to option text for comparison
            const selectedOption = selectedIndex !== undefined &&
                Array.isArray(question.options) &&
                question.options[selectedIndex]
                ? question.options[selectedIndex]
                : null;

            if (selectedOption === question.answer) {
                correctCount++;
                earnedPoints += points;
            }
        });

        const percentage = questions.length > 0
            ? Math.round((earnedPoints / totalPoints) * 100)
            : 0;

        return {
            correctCount,
            totalQuestions: questions.length,
            earnedPoints,
            totalPoints,
            percentage
        };
    };

    const handleBackToChapter = () => {
        navigate(`/chapters/${chapterId}`);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <ErrorMessage message={error} />
                <div className="mt-6">
                    <button
                        onClick={handleBackToChapter}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg"
                    >
                        Back to Chapter
                    </button>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <ErrorMessage message="Quiz not found" />
                <div className="mt-6">
                    <button
                        onClick={handleBackToChapter}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg"
                    >
                        Back to Chapter
                    </button>
                </div>
            </div>
        );
    }

    if (quizCompleted) {
        const results = calculateResults();

        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <QuizResults
                    results={results}
                    questions={questions}
                    userAnswers={answers}
                    onBackToChapter={handleBackToChapter}
                />
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <QuizHeader
                title={quiz.title}
                currentQuestion={currentQuestionIndex}
                totalQuestions={questions.length}
                score={Object.keys(answers).length}
                onBack={handleBackToChapter}
            />

            {currentQuestion && (
                <>
                    <QuizQuestion
                        question={currentQuestion.text}
                        options={currentQuestion.options || []}
                        selectedOption={answers[currentQuestion.question_id]}
                        onSelect={(index) => handleSelectAnswer(currentQuestion.question_id, index)}
                        timeLeft={timeLeft}
                        questionNumber={currentQuestionIndex + 1}
                        totalQuestions={questions.length}
                        questionType={currentQuestion.question_type}
                        difficulty={currentQuestion.difficulty}
                        points={currentQuestion.points}
                    />

                    <div className="flex justify-between mt-6">
                        <button
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className={`px-4 py-2 rounded-lg ${currentQuestionIndex === 0
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                        >
                            Previous
                        </button>

                        {currentQuestionIndex < questions.length - 1 ? (
                            <button
                                onClick={handleNextQuestion}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitQuiz}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                            >
                                Submit Quiz
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default QuizView; 