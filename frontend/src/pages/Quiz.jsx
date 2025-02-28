import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import QuizQuestion from '../components/quiz/QuizQuestion';
import QuizResults from '../components/quiz/QuizResults';
import QuizLoader from '../components/quiz/QuizLoader';
import QuizError from '../components/quiz/QuizError';
import QuizHeader from '../components/quiz/QuizHeader';
import QuizNavigation from '../components/quiz/QuizNavigation';

// Context
import { useQuiz } from '../context/QuizContext';

function Quiz() {
    const { chapterId } = useParams();
    const navigate = useNavigate();

    const { chapters } = useSelector(state => state.chapters);
    const chapter = chapters.find(ch => ch.id === chapterId || ch.chapter_id === chapterId);

    // Get quiz state and methods from context
    const {
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
        loadQuizById,
        generateQuizForChapter,
        handleOptionSelect,
        handleNextQuestion,
        resetQuiz
    } = useQuiz();

    // Fetch quiz data from backend
    useEffect(() => {
        if (!chapter) return;

        const fetchQuizData = async () => {
            // If we already have the quiz in the chapter data, use it
            if (chapter.quiz?.id) {
                await loadQuizById(chapter.quiz.id);
            } else {
                // Otherwise, generate a new quiz
                await generateQuizForChapter(chapterId);
            }
        };

        fetchQuizData();
    }, [chapterId, chapter, loadQuizById, generateQuizForChapter]);

    const handleRetry = () => {
        resetQuiz();
    };

    const handleComplete = () => {
        navigate(`/chapters/${chapterId}`);
    };

    const handleBack = () => {
        navigate(`/chapters/${chapterId}`);
    };

    // If chapter not found
    if (!chapter && !isLoading) {
        return (
            <QuizError
                message="Chapter not found"
                onBack={() => navigate('/dashboard')}
            />
        );
    }

    // If loading
    if (isLoading) {
        return <QuizLoader />;
    }

    // If error
    if (error) {
        return (
            <QuizError
                message={error}
                onRetry={() => window.location.reload()}
                onBack={() => navigate(`/chapters/${chapterId}`)}
            />
        );
    }

    // If no quiz available
    if (!quiz || questions.length === 0) {
        return (
            <QuizError
                message="No quiz available for this chapter"
                onBack={() => navigate(`/chapters/${chapterId}`)}
            />
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            <QuizHeader
                title={quiz?.title || 'Quiz Time!'}
                currentQuestion={currentQuestionIndex}
                totalQuestions={questions.length}
                score={score}
                onBack={handleBack}
            />

            <AnimatePresence mode="wait">
                {!quizCompleted && currentQuestion ? (
                    <div key="question">
                        <QuizQuestion
                            question={currentQuestion.question}
                            options={currentQuestion.options}
                            selectedOption={selectedOption}
                            onSelect={handleOptionSelect}
                            timeLeft={timeLeft}
                            questionNumber={currentQuestionIndex + 1}
                            totalQuestions={questions.length}
                        />

                        <QuizNavigation
                            onNext={handleNextQuestion}
                            isLastQuestion={currentQuestionIndex === questions.length - 1}
                            isDisabled={selectedOption === null}
                        />
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