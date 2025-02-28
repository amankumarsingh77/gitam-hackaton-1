import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

// Configuration
const QUIZ_PASS_THRESHOLD = 70; // 70% to pass
const QUIZ_COMPLETE_XP = 20; // XP awarded for completing a quiz

const QuizResults = ({ results, questions, userAnswers, onBackToChapter }) => {
    const { percentage, correctCount, totalQuestions } = results;
    const passed = percentage >= QUIZ_PASS_THRESHOLD;

    // Trigger confetti effect when passed
    useEffect(() => {
        if (passed) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // Since particles fall down, start a bit higher than random
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);
        }
    }, [passed]);

    // Helper function to get the option text from the index
    const getOptionText = (question, index) => {
        if (index === undefined) return 'Not answered';
        if (!Array.isArray(question.options)) return 'Option data unavailable';
        return question.options[index] || 'Option not found';
    };

    // Helper function to check if an answer is correct
    const isAnswerCorrect = (question, answerIndex) => {
        if (answerIndex === undefined) return false;
        if (!Array.isArray(question.options)) return false;
        if (!question.options[answerIndex]) return false;
        return question.options[answerIndex] === question.answer;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-8"
        >
            <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-center"
            >
                <h2 className="font-heading font-bold text-2xl mb-2 text-slate-800">
                    {passed ? 'Congratulations! 🎉' : 'Not quite there yet 😢'}
                </h2>
                <p className="text-gray-600 mb-6">
                    {passed
                        ? 'You\'ve successfully completed the quiz!'
                        : 'Keep learning and try again. You\'ll get it next time!'}
                </p>
            </motion.div>

            <div className="my-8 text-center">
                <motion.div
                    className="text-5xl font-bold mb-2 text-slate-800"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                >
                    {correctCount}/{totalQuestions}
                </motion.div>
                <div className="text-lg text-gray-600 mb-6">
                    {percentage}% Score
                </div>

                <div className="mt-4 mb-8">
                    <div className="h-4 bg-gray-200 rounded-full w-full max-w-md mx-auto overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.6, duration: 1 }}
                            className={`h-4 rounded-full ${passed ? 'bg-success' : 'bg-error'}`}
                        ></motion.div>
                    </div>
                    <div className="flex justify-between max-w-md mx-auto mt-2 text-sm text-gray-600">
                        <span>0%</span>
                        <span className="font-medium">{QUIZ_PASS_THRESHOLD}% required to pass</span>
                        <span>100%</span>
                    </div>
                </div>

                {passed ? (
                    <motion.div
                        className="text-success mb-4 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <span className="inline-block bg-success bg-opacity-10 px-4 py-2 rounded-full">
                            You've earned {QUIZ_COMPLETE_XP} XP!
                        </span>
                    </motion.div>
                ) : (
                    <div className="text-gray-600 mb-4">
                        Keep trying! You need {QUIZ_PASS_THRESHOLD}% to earn XP.
                    </div>
                )}
            </div>

            {/* Question Review */}
            <div className="mt-8 mb-6">
                <h3 className="font-heading font-semibold text-xl mb-4">Question Review</h3>
                <div className="space-y-6">
                    {Array.isArray(questions) && questions.length > 0 ? (
                        questions.map((question, index) => {
                            if (!question || !question.question_id) {
                                return null;
                            }

                            const userAnswerIndex = userAnswers[question.question_id];
                            const isCorrect = isAnswerCorrect(question, userAnswerIndex);

                            return (
                                <div
                                    key={question.question_id}
                                    className={`p-4 rounded-lg border text-slate-800 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                                >
                                    <div className="flex items-start">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white text-sm`}>
                                            {isCorrect ? '✓' : '✗'}
                                        </div>
                                        <div>
                                            <p className="font-medium mb-2">{index + 1}. {question.text || 'Question text unavailable'}</p>

                                            <div className="ml-2 text-sm">
                                                <p className="mb-1">
                                                    <span className="font-medium">Your answer:</span> {getOptionText(question, userAnswerIndex)}
                                                </p>

                                                {!isCorrect && question.answer && (
                                                    <p className="mb-1 text-green-700">
                                                        <span className="font-medium">Correct answer:</span> {question.answer}
                                                    </p>
                                                )}

                                                {question.explanation && (
                                                    <p className="mt-2 text-gray-600 bg-white p-2 rounded border border-gray-200">
                                                        <span className="font-medium">Explanation:</span> {question.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-500">
                            No question data available for review
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBackToChapter}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    Back to Chapter
                </motion.button>
            </div>
        </motion.div>
    );
};

QuizResults.propTypes = {
    results: PropTypes.shape({
        correctCount: PropTypes.number.isRequired,
        totalQuestions: PropTypes.number.isRequired,
        earnedPoints: PropTypes.number.isRequired,
        totalPoints: PropTypes.number.isRequired,
        percentage: PropTypes.number.isRequired
    }).isRequired,
    questions: PropTypes.array.isRequired,
    userAnswers: PropTypes.object.isRequired,
    onBackToChapter: PropTypes.func.isRequired
};

export default QuizResults; 