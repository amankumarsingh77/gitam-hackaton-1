import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import LearningDashboard from './CodeEditor';

// Hero section animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5 },
    },
};

const Hero = () => {
    return (
        <motion.section
            className="py-20 md:py-28 bg-gradient-to-br from-white to-indigo-50"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                    <motion.div variants={itemVariants} className="max-w-xl">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-slate-900 mb-6 leading-tight">
                            Learn Anything with <span className="bg-gradient-to-r from-indigo-600 to-violet-500 text-transparent bg-clip-text">Memes</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                            Bit Buddy makes learning fun and engaging through memes, interactive lessons, and gamified quizzes — for both programming and school subjects.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <Link
                                to="/register"
                                className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-8 py-3.5 text-lg transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Get Started <FiArrowRight className="ml-2" />
                            </Link>
                            <button
                                onClick={() => {
                                    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 hover:text-indigo-600 font-medium rounded-lg px-8 py-3.5 text-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Learn More
                            </button>
                        </div>
                    </motion.div>
                    <motion.div
                        variants={itemVariants}
                        className="mt-12 lg:mt-0 flex justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{
                                scale: 1,
                                transition: {
                                    yoyo: Infinity,
                                    duration: 3,
                                    ease: "easeInOut"
                                }
                            }}
                            className="relative w-full max-w-lg"
                        >
                            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                            <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                            <div className="relative">
                                <LearningDashboard />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Add CSS for blob animation */}
            <style jsx>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </motion.section>
    );
};

export default Hero;
