import { motion } from 'framer-motion';

const QuizLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center h-64">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-4"
            />
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 font-medium"
            >
                Loading your quiz...
            </motion.p>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-gray-500 mt-2"
            >
                Preparing challenging questions for you
            </motion.p>
        </div>
    );
};

export default QuizLoader; 