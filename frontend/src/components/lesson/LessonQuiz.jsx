import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const LessonQuiz = ({ quiz, onComplete }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);

    // Reset state when quiz changes
    useEffect(() => {
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCorrect(false);
        setShowExplanation(false);
        setQuizCompleted(false);
    }, [quiz]);

    const handleOptionSelect = (index) => {
        if (isAnswered) return;

        setSelectedOption(index);
        setIsAnswered(true);

        const correct = index === quiz.correctIndex;
        setIsCorrect(correct);

        // Show explanation after a short delay
        setTimeout(() => {
            setShowExplanation(true);
        }, 500);

        // If correct, call onComplete after a delay
        if (correct && !quizCompleted) {
            setQuizCompleted(true);
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 2000);
        }
    };

    const handleContinue = () => {
        if (!quizCompleted) {
            setQuizCompleted(true);
            if (onComplete) {
                onComplete();
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-md border border-slate-200 my-8 overflow-hidden"
        >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-medium text-lg text-slate-800 flex items-center">
                    <span className="text-primary-600 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </span>
                    Knowledge Check
                </h3>
            </div>

            <div className="p-6">
                <p className="text-slate-800 font-medium text-lg mb-4">{quiz.question}</p>

                <div className="space-y-3 mb-4">
                    {quiz.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            disabled={isAnswered}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-all flex items-start ${isAnswered && index === quiz.correctIndex
                                    ? 'border-green-500 bg-green-50'
                                    : isAnswered && index === selectedOption && index !== quiz.correctIndex
                                        ? 'border-red-500 bg-red-50'
                                        : selectedOption === index
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 mr-3 ${isAnswered && index === quiz.correctIndex
                                    ? 'bg-green-500 text-white'
                                    : isAnswered && index === selectedOption && index !== quiz.correctIndex
                                        ? 'bg-red-500 text-white'
                                        : selectedOption === index
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                }`}>
                                {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1">
                                <span className={`${isAnswered && index === quiz.correctIndex ? 'text-green-700 font-medium' :
                                        isAnswered && index === selectedOption && index !== quiz.correctIndex ? 'text-red-700' :
                                            'text-slate-700'
                                    }`}>
                                    {option}
                                </span>

                                {isAnswered && index === quiz.correctIndex && (
                                    <span className="ml-2 text-green-600">✓</span>
                                )}

                                {isAnswered && index === selectedOption && index !== quiz.correctIndex && (
                                    <span className="ml-2 text-red-600">✗</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}
                    >
                        <h4 className={`font-medium mb-2 ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                            {isCorrect ? 'Correct!' : 'Not quite right'}
                        </h4>
                        <p className="text-slate-700">{quiz.explanation}</p>
                    </motion.div>
                )}

                {isAnswered && !isCorrect && !quizCompleted && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleContinue}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {quizCompleted && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-4 text-center text-green-600 font-medium"
                    >
                        ✓ Completed
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

LessonQuiz.propTypes = {
    quiz: PropTypes.shape({
        question: PropTypes.string.isRequired,
        options: PropTypes.arrayOf(PropTypes.string).isRequired,
        correctIndex: PropTypes.number.isRequired,
        explanation: PropTypes.string
    }).isRequired,
    onComplete: PropTypes.func
};

export default LessonQuiz; 