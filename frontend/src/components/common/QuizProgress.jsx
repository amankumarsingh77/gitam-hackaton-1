import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * QuizProgress component displays the quiz status and progress for a chapter
 * 
 * @param {Object} props - Component props
 * @param {Object} props.chapter - The chapter object
 * @param {boolean} props.showButton - Whether to show the quiz button
 * @param {boolean} props.compact - Whether to show a compact version
 * @returns {JSX.Element} - Rendered component
 */
function QuizProgress({ chapter, showButton = true, compact = false }) {
    const { completedLessons, completedQuizzes } = useSelector(state => state.user);

    if (!chapter) return null;

    // Get chapter ID (handle both formats)
    const chapterId = chapter.chapter_id || chapter.id;

    // Check if quiz exists
    const hasQuiz = Boolean(chapter.quiz);

    // Check if quiz is completed
    const isQuizCompleted = completedQuizzes.includes(chapter.quiz?.id);

    // Check if all lessons are completed
    const allLessons = chapter.lessons || [];
    const allLessonsCompleted = allLessons.every(lesson =>
        completedLessons.includes(lesson.id || lesson.lesson_id)
    );

    // Calculate progress
    const totalLessons = allLessons.length;
    const completedLessonsCount = allLessons.filter(lesson =>
        completedLessons.includes(lesson.id || lesson.lesson_id)
    ).length;

    // Get quiz status text and color
    const getQuizStatus = () => {
        if (isQuizCompleted) {
            return {
                text: 'Quiz Completed',
                color: 'text-success',
                bgColor: 'bg-success bg-opacity-10',
                icon: '✓',
                emoji: '🏆'
            };
        }

        if (allLessonsCompleted) {
            return {
                text: 'Ready to Take Quiz',
                color: 'text-primary',
                bgColor: 'bg-primary bg-opacity-10',
                icon: '🎯',
                emoji: '🎯'
            };
        }

        return {
            text: `Complete ${totalLessons - completedLessonsCount} more lesson${totalLessons - completedLessonsCount !== 1 ? 's' : ''}`,
            color: 'text-warning',
            bgColor: 'bg-warning bg-opacity-10',
            icon: '📚',
            emoji: '📚'
        };
    };

    const quizStatus = getQuizStatus();

    if (compact) {
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${quizStatus.bgColor}`}>
                <span className={`${quizStatus.color} font-medium text-sm`}>
                    <span className="mr-1">{quizStatus.icon}</span>
                    {quizStatus.text}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100 overflow-hidden relative"
        >
            {/* Background pattern for visual interest */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" fill="currentColor" className={quizStatus.color.replace('text-', '')} />
                    <path d="M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z" fill="currentColor" className={quizStatus.color.replace('text-', '')} />
                </svg>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div>
                    <div className="flex items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-2xl mr-2"
                        >
                            {quizStatus.emoji}
                        </motion.div>
                        <h3 className="font-heading font-bold text-xl text-gray-800">Knowledge Check</h3>
                    </div>

                    <p className="text-gray-600 mt-1">
                        {hasQuiz
                            ? `Test your understanding of ${chapter.title}`
                            : 'No quiz available for this chapter yet'}
                    </p>

                    <div className={`mt-3 ${quizStatus.color} flex items-center`}>
                        <motion.span
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`${quizStatus.bgColor} ${quizStatus.color} p-1 rounded-full mr-2 inline-flex items-center justify-center w-6 h-6`}
                        >
                            {quizStatus.icon}
                        </motion.span>
                        <span className="font-medium">{quizStatus.text}</span>
                    </div>

                    {/* Progress indicator for lessons */}
                    {!allLessonsCompleted && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Lesson Progress</span>
                                <span>{completedLessonsCount}/{totalLessons}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full w-full max-w-xs">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedLessonsCount / totalLessons) * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-2 bg-primary rounded-full"
                                ></motion.div>
                            </div>
                        </div>
                    )}
                </div>

                {showButton && hasQuiz && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Link
                            to={allLessonsCompleted ? `/chapters/${chapterId}/quiz` : '#'}
                            onClick={e => !allLessonsCompleted && e.preventDefault()}
                            className={`px-6 py-3 rounded-lg font-medium text-center block ${!allLessonsCompleted
                                ? 'bg-gray-300 cursor-not-allowed'
                                : isQuizCompleted
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                                } transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1`}
                        >
                            {isQuizCompleted ? 'Retake Quiz' : allLessonsCompleted ? 'Start Quiz' : 'Complete All Lessons First'}
                        </Link>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default QuizProgress; 