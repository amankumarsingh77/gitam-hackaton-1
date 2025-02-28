import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const QuizHeader = ({ title, currentQuestion, totalQuestions, score, onBack }) => {
    // Use safe values with defaults
    const safeTitle = title || 'Quiz Time!';
    const safeCurrentQuestion = typeof currentQuestion === 'number' ? currentQuestion : 0;
    const safeTotalQuestions = typeof totalQuestions === 'number' && totalQuestions > 0 ? totalQuestions : 1;
    const safeScore = typeof score === 'number' ? score : 0;

    // Calculate progress percentage safely
    const progressPercentage = Math.min(100, Math.max(0, (safeCurrentQuestion / safeTotalQuestions) * 100));

    return (
        <div className="mb-6">
            {/* Back button */}
            <motion.button
                whileHover={{ x: -3 }}
                onClick={onBack}
                className="flex items-center text-primary mb-4"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
            </motion.button>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-heading font-bold text-2xl text-slate-800 mb-6 text-center"
            >
                {safeTitle}
            </motion.h1>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>Score: {safeScore}/{safeTotalQuestions}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        className="h-2 bg-primary rounded-full"
                    ></motion.div>
                </div>
            </div>
        </div>
    );
};

QuizHeader.propTypes = {
    title: PropTypes.string,
    currentQuestion: PropTypes.number,
    totalQuestions: PropTypes.number,
    score: PropTypes.number,
    onBack: PropTypes.func.isRequired
};

QuizHeader.defaultProps = {
    title: 'Quiz Time!',
    currentQuestion: 0,
    totalQuestions: 1,
    score: 0
};

export default QuizHeader; 