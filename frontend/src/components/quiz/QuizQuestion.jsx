import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Configuration
const TIME_PER_QUESTION = 30; // 30 seconds per question

const QuizQuestion = ({
    question,
    options,
    selectedOption,
    onSelect,
    timeLeft,
    questionNumber,
    totalQuestions
}) => {
    // Ensure options is always an array
    const safeOptions = Array.isArray(options) ? options : [];

    // Format time for display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
            {/* Question counter */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-500">
                    Question {questionNumber} of {totalQuestions}
                </span>
            </div>

            {/* Timer */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span>Time Left</span>
                    <span className={timeLeft < 10 ? 'text-red-600 font-bold' : ''}>{formatTime(timeLeft)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / (TIME_PER_QUESTION * totalQuestions)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-2 rounded-full ${timeLeft < 10 ? 'bg-red-500' : 'bg-blue-600'}`}
                    ></motion.div>
                </div>
            </div>

            <h3 className="font-heading font-semibold text-slate-800 text-lg mb-6">
                {question || 'Question text unavailable'}
            </h3>

            <div className="space-y-3">
                {safeOptions.length > 0 ? (
                    safeOptions.map((option, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(index)}
                            className={`w-full p-4 rounded-lg border text-left transition-colors ${selectedOption === index
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-slate-700'
                                }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${selectedOption === index
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-400'
                                    }`}>
                                    {selectedOption === index && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <div>{option}</div>
                            </div>
                        </motion.button>
                    ))
                ) : (
                    <div className="text-center text-gray-500 p-4 border border-gray-200 rounded-lg">
                        No options available for this question
                    </div>
                )}
            </div>
        </motion.div>
    );
};

QuizQuestion.propTypes = {
    question: PropTypes.string,
    options: PropTypes.array,
    selectedOption: PropTypes.number,
    onSelect: PropTypes.func.isRequired,
    timeLeft: PropTypes.number.isRequired,
    questionNumber: PropTypes.number.isRequired,
    totalQuestions: PropTypes.number.isRequired
};

QuizQuestion.defaultProps = {
    options: [],
    question: 'Question text unavailable'
};

export default QuizQuestion; 