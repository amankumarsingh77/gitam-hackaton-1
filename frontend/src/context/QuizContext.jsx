import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { completeQuiz, addXp } from '../store/slices/userSlice';
import quizService from '../services/quizService';

// Configuration
const QUIZ_PASS_THRESHOLD = 70; // 70% to pass
const QUIZ_COMPLETE_XP = 20; // XP awarded for completing a quiz
const TIME_PER_QUESTION = 30; // 30 seconds per question

// Create context
const QuizContext = createContext();

export const useQuiz = () => useContext(QuizContext);

export const QuizProvider = ({ children }) => {
    const dispatch = useDispatch();

    // Quiz state
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reset quiz state
    const resetQuiz = useCallback(() => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setScore(0);
        setQuizCompleted(false);
        setAnswers([]);
        setTimeLeft(TIME_PER_QUESTION);
    }, []);

    // Load quiz by ID
    const loadQuizById = useCallback(async (quizId) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await quizService.getQuizById(quizId);
            const quizData = response.data.data;
            setQuiz(quizData.quiz);
            setQuestions(quizData.questions);
        } catch (err) {
            console.error('Failed to load quiz:', err);
            setError('Failed to load quiz. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Generate quiz for chapter
    const generateQuizForChapter = useCallback(async (chapterId) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await quizService.generateQuiz(chapterId);
            const generatedQuiz = response.data;
            setQuiz(generatedQuiz);
            setQuestions(generatedQuiz.questions || []);
        } catch (err) {
            console.error('Failed to generate quiz:', err);
            setError('Failed to generate quiz. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle option selection
    const handleOptionSelect = useCallback((index) => {
        setSelectedOption(index);
    }, []);

    // Handle next question
    const handleNextQuestion = useCallback(() => {
        if (!questions[currentQuestionIndex]) return;

        // Save answer
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        const answer = {
            questionId: currentQuestion.id || currentQuestion.question_id,
            selectedOption,
            isCorrect,
            answer: currentQuestion.options[selectedOption]
        };

        setAnswers(prev => [...prev, answer]);

        // Update score
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // Move to next question or complete quiz
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setTimeLeft(TIME_PER_QUESTION);
        } else {
            setQuizCompleted(true);

            // Submit answers to backend
            submitQuizAnswers([...answers, answer]);
        }
    }, [currentQuestionIndex, questions, selectedOption, answers]);

    // Submit quiz answers
    const submitQuizAnswers = useCallback(async (finalAnswers) => {
        if (!quiz) return;

        try {
            const formattedAnswers = finalAnswers.map(ans => ({
                question_id: ans.questionId,
                answer: ans.answer
            }));

            const response = await quizService.submitQuizAnswers(
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
            const percentage = (score / questions.length) * 100;
            if (percentage >= QUIZ_PASS_THRESHOLD) {
                dispatch(completeQuiz({
                    quizId: quiz.id || quiz.quiz_id,
                    score: percentage
                }));
                dispatch(addXp(QUIZ_COMPLETE_XP));
            }
        }
    }, [quiz, score, questions.length, dispatch]);

    // Timer effect
    useEffect(() => {
        if (quizCompleted || !questions[currentQuestionIndex]) return;

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
    }, [currentQuestionIndex, quizCompleted, questions, handleNextQuestion]);

    // Calculate if passed
    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
    const passed = percentage >= QUIZ_PASS_THRESHOLD;

    // Context value
    const value = {
        quiz,
        questions,
        currentQuestionIndex,
        selectedOption,
        score,
        quizCompleted,
        timeLeft,
        isLoading,
        error,
        percentage,
        passed,

        // Methods
        resetQuiz,
        loadQuizById,
        generateQuizForChapter,
        handleOptionSelect,
        handleNextQuestion,
        submitQuizAnswers,

        // Constants
        QUIZ_PASS_THRESHOLD,
        QUIZ_COMPLETE_XP,
        TIME_PER_QUESTION
    };

    return (
        <QuizContext.Provider value={value}>
            {children}
        </QuizContext.Provider>
    );
};

QuizProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default QuizContext; 