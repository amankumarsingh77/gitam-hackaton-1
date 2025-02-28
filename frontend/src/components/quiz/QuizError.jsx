import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const QuizError = ({ message, onRetry, onBack }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto"
        >
            <div className="text-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <h2 className="font-heading font-bold text-xl mb-2">Oops! Something went wrong</h2>

            <p className="text-gray-600 mb-6">
                {message || 'We encountered an error while loading your quiz. Please try again.'}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                {onRetry && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRetry}
                        className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                        Try Again
                    </motion.button>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="btn btn-primary"
                >
                    Back to Chapter
                </motion.button>
            </div>
        </motion.div>
    );
};

QuizError.propTypes = {
    message: PropTypes.string,
    onRetry: PropTypes.func,
    onBack: PropTypes.func.isRequired
};

export default QuizError; 