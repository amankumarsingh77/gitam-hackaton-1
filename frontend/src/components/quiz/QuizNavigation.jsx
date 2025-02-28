import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const QuizNavigation = ({ onNext, isLastQuestion, isDisabled }) => {
    return (
        <div className="flex justify-end mt-6">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNext}
                disabled={isDisabled}
                className={`btn ${isDisabled
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
            >
                {isLastQuestion ? 'Submit Quiz' : 'Next Question'}

                {!isLastQuestion && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                )}
            </motion.button>
        </div>
    );
};

QuizNavigation.propTypes = {
    onNext: PropTypes.func.isRequired,
    isLastQuestion: PropTypes.bool.isRequired,
    isDisabled: PropTypes.bool.isRequired
};

export default QuizNavigation; 