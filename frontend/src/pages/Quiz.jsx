import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { completeQuiz, addXp } from '../store/slices/userSlice';
import { chaptersAPI } from '../services/api';

// Configuration
const QUIZ_PASS_THRESHOLD = 70; // 70% to pass
const QUIZ_COMPLETE_XP = 20; // XP awarded for completing a quiz
const TIME_PER_QUESTION = 30; // 30 seconds per question

function QuizQuestion({ question, options, selectedOption, onSelect, timeLeft }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-4"
        >
            {/* Timer */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span>Time Left</span>
                    <span className={timeLeft < 10 ? 'text-error font-bold' : ''}>{timeLeft}s</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                    <div
                        className={`h-2 rounded-full ${timeLeft < 10 ? 'bg-error' : 'bg-primary'}`}
                        style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                    ></div>
                </div>
            </div>

            <h3 className="font-heading font-semibold text-lg mb-4">{question}</h3>

            <div className="space-y-3">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(index)}
                        className={`w-full p-3 text-left rounded border transition-all ${selectedOption === index
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-gray-300 hover:border-primary'
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

function QuizResults({ score, totalQuestions, passed, onRetry, onComplete }) {
    // Calculate the percentage
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 text-center"
        >
            <h2 className="font-heading font-bold text-2xl mb-2">
                {passed ? 'Congratulations! 🎉' : 'Not quite there yet 😢'}
            </h2>

            <div className="my-6">
                <div className="text-4xl font-bold mb-2">
                    {score}/{totalQuestions}
                </div>
                <div className="text-lg text-gray-600">
                    {percentage}% Score
                </div>

                <div className="mt-4 mb-6">
                    <div className="h-4 bg-gray-200 rounded-full w-full max-w-md mx-auto">
                        <div
                            className={`h-4 rounded-full ${passed ? 'bg-success' : 'bg-error'}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between max-w-md mx-auto mt-1 text-sm text-gray-600">
                        <span>0%</span>
                        <span className="font-medium">{QUIZ_PASS_THRESHOLD}% required to pass</span>
                        <span>100%</span>
                    </div>
                </div>

                {passed ? (
                    <div className="text-success mb-4">
                        You've earned {QUIZ_COMPLETE_XP} XP!
                    </div>
                ) : (
                    <div className="text-gray-600 mb-4">
                        Keep trying! You need {QUIZ_PASS_THRESHOLD}% to earn XP.
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                {!passed && (
                    <button
                        onClick={onRetry}
                        className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                        Try Again
                    </button>
                )}

                <button
                    onClick={onComplete}
                    className={`btn ${passed ? 'btn-primary' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                >
                    {passed ? 'Complete & Continue' : 'Back to Dashboard'}
                </button>
            </div>
        </motion.div>
    );
}

function Quiz() {
    const { chapterId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { chapters } = useSelector(state => state.chapters);
    const chapter = chapters.find(ch => ch.id === chapterId || ch.chapter_id === chapterId);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if chapter exists
    if (!chapter && !isLoading) {
        return (
            <div className="text-center py-12">
                <h2 className="font-heading font-bold text-xl mb-2">Chapter not found</h2>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary mt-4"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Fetch quiz data from backend
    useEffect(() => {
        const fetchQuizData = async () => {
            if (!chapter) return;

            setIsLoading(true);
            setError(null);

            try {
                // If we already have the quiz in the chapter data, use it
                if (chapter.quiz?.id) {
                    const response = await chaptersAPI.getQuizById(chapter.quiz.id);
                    const quizData = response.data.data;
                    setQuiz(quizData.quiz);
                    setQuestions(quizData.questions);
                } else {
                    // Otherwise, generate a new quiz
                    const response = await chaptersAPI.generateQuiz(chapterId);
                    const generatedQuiz = response.data;
                    setQuiz(generatedQuiz);
                    setQuestions(generatedQuiz.questions || []);
                }
            } catch (err) {
                console.error('Failed to fetch quiz:', err);
                setError('Failed to load quiz. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizData();
    }, [chapterId, chapter]);

    // If loading or error
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <h2 className="font-heading font-bold text-xl mb-2">Error</h2>
                <p className="text-error mb-4">{error}</p>
                <button
                    onClick={() => navigate(`/chapters/${chapterId}`)}
                    className="btn btn-primary mt-4"
                >
                    Back to Chapter
                </button>
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="font-heading font-bold text-xl mb-2">No quiz available</h2>
                <button
                    onClick={() => navigate(`/chapters/${chapterId}`)}
                    className="btn btn-primary mt-4"
                >
                    Back to Chapter
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    // Calculate if passed
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= QUIZ_PASS_THRESHOLD;

    // Timer effect
    useEffect(() => {
        if (quizCompleted || !currentQuestion) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleNextQuestion(); // Time's up, move to next question
                    return TIME_PER_QUESTION;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestionIndex, quizCompleted, currentQuestion]);

    // Reset timer when question changes
    useEffect(() => {
        setTimeLeft(TIME_PER_QUESTION);
    }, [currentQuestionIndex]);

    const handleOptionSelect = (index) => {
        setSelectedOption(index);
    };

    const handleNextQuestion = () => {
        // Save answer
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        const answer = {
            questionId: currentQuestion.id || currentQuestion.question_id,
            selectedOption,
            isCorrect,
            answer: currentQuestion.options[selectedOption]
        };

        setAnswers([...answers, answer]);

        // Update score
        if (isCorrect) {
            setScore(score + 1);
        }

        // Move to next question or complete quiz
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
        } else {
            setQuizCompleted(true);

            // Submit answers to backend
            submitQuizAnswers([...answers, answer]);
        }
    };

    const submitQuizAnswers = async (finalAnswers) => {
        try {
            const formattedAnswers = finalAnswers.map(ans => ({
                question_id: ans.questionId,
                answer: ans.answer
            }));

            const response = await chaptersAPI.submitQuizAnswers(
                quiz.id || quiz.quiz_id,
                formattedAnswers
            );

            const result = response.data.data;

            // If passed, award XP and mark quiz as completed
            if (result.score >= QUIZ_PASS_THRESHOLD) {
                dispatch(completeQuiz({
                    quizId: quiz.id || quiz.quiz_id,
                    score: result.score
                }));
                dispatch(addXp(QUIZ_COMPLETE_XP));
            }
        } catch (err) {
            console.error('Failed to submit quiz answers:', err);
            // Continue with local scoring if submission fails
            if (passed) {
                dispatch(completeQuiz({
                    quizId: quiz.id || quiz.quiz_id,
                    score: percentage
                }));
                dispatch(addXp(QUIZ_COMPLETE_XP));
            }
        }
    };

    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setScore(0);
        setQuizCompleted(false);
        setAnswers([]);
        setTimeLeft(TIME_PER_QUESTION);
    };

    const handleComplete = () => {
        if (passed) {
            // Navigate back to chapter view
            navigate(`/chapters/${chapterId}`);
        } else {
            // Back to chapter view
            navigate(`/chapters/${chapterId}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-6">
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/chapters/${chapter.id}`)}
                    className="flex items-center text-primary"
                >
                    <span className="mr-1">←</span> Back to {chapter.title}
                </button>
            </div>

            <h1 className="font-heading font-bold text-2xl mb-6 text-center">
                {quiz?.title || 'Quiz Time!'}
            </h1>

            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>Score: {score}/{questions.length}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                    <div
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!quizCompleted && currentQuestion ? (
                    <div key="question">
                        <QuizQuestion
                            question={currentQuestion.question}
                            options={currentQuestion.options}
                            selectedOption={selectedOption}
                            onSelect={handleOptionSelect}
                            timeLeft={timeLeft}
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={handleNextQuestion}
                                disabled={selectedOption === null}
                                className={`btn ${selectedOption === null
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'btn-primary'
                                    }`}
                            >
                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div key="results">
                        <QuizResults
                            score={score}
                            totalQuestions={questions.length}
                            passed={passed}
                            onRetry={handleRetry}
                            onComplete={handleComplete}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Quiz; 