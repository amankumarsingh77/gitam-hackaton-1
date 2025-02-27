import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCurrentChapter, fetchChapterById, generateMemes, generateQuiz, fetchCustomLessonsByChapter } from '../store/slices/chaptersSlice';
import { completeLesson } from '../store/slices/userSlice';
import { chaptersAPI } from '../services/api';
import QuizProgress from '../components/common/QuizProgress';

// Helper function to get subject gradient
const getSubjectGradient = (subject) => {
    if (!subject) return 'from-indigo-500 to-purple-500';

    subject = subject.toLowerCase();
    if (subject === 'math') return 'from-blue-500 to-cyan-400';
    if (subject === 'science') return 'from-emerald-500 to-teal-400';
    if (subject === 'history') return 'from-amber-500 to-orange-400';
    if (subject === 'english') return 'from-rose-500 to-pink-400';
    if (subject === 'programming') return 'from-violet-500 to-purple-400';
    return 'from-indigo-500 to-purple-500';
};

// Helper function to get subject icon
const getSubjectIcon = (subject) => {
    if (!subject) return '📚';

    subject = subject.toLowerCase();
    if (subject === 'math') return '🧮';
    if (subject === 'science') return '🔬';
    if (subject === 'history') return '🏛️';
    if (subject === 'english') return '📝';
    if (subject === 'programming') return '💻';
    return '📚';
};

// Helper function to extract time and difficulty from description
const extractMetadata = (description) => {
    if (!description) return { time: null, difficulty: 'Basic' };

    const timeMatch = description.match(/\[(\d+)\s*min/i);
    const difficultyMatch = description.match(/\|\s*([A-Za-z]+)\]/i);

    return {
        time: timeMatch ? timeMatch[1] : null,
        difficulty: difficultyMatch ? difficultyMatch[1] : 'Basic'
    };
};

// Lesson Modal Component to display lesson content
function LessonModal({ lesson, isOpen, onClose, chapterId }) {
    if (!lesson || !isOpen) return null;

    const { time, difficulty } = extractMetadata(lesson.description);
    const subject = lesson.subject || '';

    // Parse objectives from description
    const getObjectives = (description) => {
        if (!description) return [];
        const objectivesSection = description.split('\n\nObjectives:')[1];
        if (!objectivesSection) return [];

        return objectivesSection
            .split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.trim().substring(1).trim());
    };

    const objectives = getObjectives(lesson.description);

    // Parse content sections
    const parseContent = (content) => {
        if (!content) return [];

        const sections = [];
        let currentSection = { title: '', content: [] };

        content.split('\n').forEach(line => {
            if (line.startsWith('📚') || line.startsWith('🎯') ||
                line.startsWith('📍') || line.startsWith('🖼️') ||
                line.startsWith('🎮') || line.startsWith('📝') ||
                line.startsWith('🌟')) {

                if (currentSection.title) {
                    sections.push({ ...currentSection });
                }

                currentSection = {
                    title: line.trim(),
                    content: []
                };
            } else if (line.trim()) {
                currentSection.content.push(line.trim());
            }
        });

        if (currentSection.title) {
            sections.push(currentSection);
        }

        return sections;
    };

    const contentSections = parseContent(lesson.content);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className={`bg-gradient-to-r ${getSubjectGradient(subject)} p-6 text-white`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="font-heading font-bold text-2xl mb-2">{lesson.title}</h2>
                                    <div className="flex items-center gap-3">
                                        {time && (
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                                {time} min
                                            </span>
                                        )}
                                        {difficulty && (
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                                {difficulty}
                                            </span>
                                        )}
                                        {subject && (
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                                <span className="mr-1">{getSubjectIcon(subject)}</span> {subject}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="font-heading font-bold text-xl text-gray-800 mb-3">Overview</h3>
                                <p className="text-gray-700">{lesson.description?.split('\n\nObjectives:')[0]}</p>
                            </div>

                            {/* Objectives */}
                            {objectives.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-heading font-bold text-xl text-gray-800 mb-3">Objectives</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {objectives.map((objective, index) => (
                                            <li key={index} className="text-gray-700">{objective}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Lesson Content */}
                            <div className="mb-6">
                                <h3 className="font-heading font-bold text-xl text-gray-800 mb-3">Lesson Content</h3>

                                <div className="space-y-6">
                                    {contentSections.map((section, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <h4 className="font-heading font-bold text-lg text-gray-800 mb-2">{section.title}</h4>
                                            <div className="space-y-2">
                                                {section.content.map((paragraph, pIndex) => (
                                                    <p key={pIndex} className="text-gray-700">{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
                            <span className="text-gray-500 text-sm">
                                {lesson.is_custom ? 'Custom Lesson' : 'Regular Lesson'}
                            </span>
                            <Link
                                to={`/chapters/${chapterId}/lessons/${lesson.lesson_id || lesson.id}`}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md"
                            >
                                Start Lesson
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function LessonCard({ lesson, isCompleted, index, chapterId, onClick }) {
    const { time, difficulty } = extractMetadata(lesson.description);
    const subject = lesson.subject || '';
    const isCustom = lesson.is_custom || false;

    return (
        <Link to={`/chapters/${chapterId}/lessons/${lesson.lesson_id || lesson.id}`}>
            <motion.div
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className={`bg-white rounded-xl shadow-md overflow-hidden border ${isCompleted ? 'border-success' : 'border-gray-200'} h-full cursor-pointer`}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${isCompleted ? 'bg-success' : 'bg-indigo-500'}`}>
                            {isCompleted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            {isCustom && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Custom
                                </span>
                            )}
                            {time && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {time}
                                </span>
                            )}
                            {difficulty && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {difficulty}
                                </span>
                            )}
                        </div>
                    </div>

                    <h3 className="font-heading font-bold text-lg mb-2 text-gray-800">{lesson.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{lesson.description.split('\n')[0]}</p>
                </div>
            </motion.div>
        </Link>
    );
}

function ChapterView() {
    const { chapterId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [nextChapter, setNextChapter] = useState(null);

    const { chapters, isLoading, customLessons } = useSelector(state => state.chapters);
    const { completedLessons, completedQuizzes } = useSelector(state => state.user);

    // Find chapter by either chapter_id or id
    const chapter = chapters.find(ch => ch.chapter_id === chapterId || ch.id === chapterId);

    // Get the actual chapter ID to use consistently throughout the component
    const actualChapterId = chapter ? (chapter.chapter_id || chapter.id) : chapterId;

    // Debug log to check chapter ID
    useEffect(() => {
        console.log("ChapterView - URL chapter ID:", chapterId);
        console.log("ChapterView - Found chapter:", chapter);
        console.log("ChapterView - Using actual chapter ID:", actualChapterId);
    }, [chapterId, chapter, actualChapterId]);

    // Fetch chapter data when component mounts
    useEffect(() => {
        if (chapterId) {
            dispatch(fetchChapterById(chapterId));
            dispatch(fetchCustomLessonsByChapter(chapterId));
        }
    }, [dispatch, chapterId]);

    // Find the next chapter in sequence
    useEffect(() => {
        if (chapter && chapters.length > 0) {
            // Sort chapters by order or id
            const sortedChapters = [...chapters].sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return 0;
            });

            // Find current chapter index
            const currentIndex = sortedChapters.findIndex(ch =>
                ch.id === actualChapterId || ch.chapter_id === actualChapterId
            );

            // Set next chapter if exists
            if (currentIndex !== -1 && currentIndex < sortedChapters.length - 1) {
                setNextChapter(sortedChapters[currentIndex + 1]);
            } else {
                setNextChapter(null);
            }
        }
    }, [chapter, chapters, actualChapterId]);

    useEffect(() => {
        if (chapter) {
            dispatch(setCurrentChapter(actualChapterId));
        }
    }, [dispatch, chapter, actualChapterId]);

    const handleGenerateMemes = async () => {
        if (!chapter) return;

        setIsGenerating(true);
        setError('');

        try {
            await dispatch(generateMemes({
                chapterId: chapter.id,
                topic: chapter.title
            })).unwrap();
        } catch (err) {
            setError('Failed to generate memes. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!chapter) return;

        setIsGenerating(true);
        setError('');

        try {
            await dispatch(generateQuiz(chapter.id)).unwrap();
        } catch (err) {
            setError('Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNavigateToNextChapter = () => {
        if (nextChapter) {
            navigate(`/chapters/${nextChapter.id || nextChapter.chapter_id}`);
        } else {
            navigate('/dashboard');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
        );
    }

    if (!chapter) {
        return (
            <div className="text-center py-12">
                <h2 className="font-heading font-bold text-xl mb-2">Chapter not found</h2>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary mt-4"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Calculate progress
    const regularLessons = chapter.lessons || [];
    const allLessons = [...regularLessons, ...(customLessons || [])];
    const totalItems = allLessons.length + (chapter.quiz ? 1 : 0); // +1 for quiz if it exists
    const completedItems =
        (allLessons.filter(lesson => completedLessons.includes(lesson.id || lesson.lesson_id))?.length || 0) +
        (completedQuizzes.includes(chapter.quiz?.id) ? 1 : 0);

    const progress = Math.round((completedItems / totalItems) * 100);
    const quizCompleted = completedQuizzes.includes(chapter.quiz?.id);
    const allLessonsCompleted = allLessons.every(lesson =>
        completedLessons.includes(lesson.id || lesson.lesson_id)
    );

    // Use all lessons (regular + custom) based on active tab
    const filteredLessons = activeTab === 'all'
        ? allLessons
        : activeTab === 'regular'
            ? regularLessons
            : customLessons || [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
                >
                    <span className="mr-1">←</span> Back to Dashboard
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-indigo-100"
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-heading font-bold text-3xl mb-2 text-gray-800">{chapter.title}</h1>
                        <p className="text-gray-600">{chapter.description}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <div className="bg-slate-700 text-white p-3 rounded-lg shadow-md">
                            {getSubjectIcon(chapter.subject)}
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">Subject</div>
                            <div className="font-medium text-slate-800 capitalize">{chapter.subject || 'General'}</div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Progress</span>
                        <span className="font-medium text-slate-700">{progress}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-3 bg-slate-600 rounded-full"
                        ></motion.div>
                    </div>
                </div>

                {/* Quiz Progress Component */}
                {chapter.quiz && (
                    <div className="mb-6">
                        <QuizProgress chapter={chapter} />
                    </div>
                )}

                {quizCompleted && nextChapter && (
                    <div className="mb-4">
                        <button
                            onClick={handleNavigateToNextChapter}
                            className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-medium transition-all shadow-md"
                        >
                            Continue to Next Chapter: {nextChapter.title}
                        </button>
                    </div>
                )}
                {chapter.lessons?.length === 0 && (
                    <div className="mt-4 p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-heading font-bold text-lg mb-4 text-slate-800">Admin Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleGenerateMemes}
                                disabled={isGenerating}
                                className={`px-4 py-2 rounded-lg font-medium ${isGenerating ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-800'} transition-colors shadow-sm`}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Memes'}
                            </button>
                            <button
                                onClick={handleGenerateQuiz}
                                disabled={isGenerating}
                                className={`px-4 py-2 rounded-lg font-medium ${isGenerating ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-600 text-white hover:bg-slate-700'} transition-colors shadow-sm`}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Quiz'}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            <div className="mb-6 flex justify-between items-center">
                <h2 className="font-heading font-bold text-2xl text-gray-800">Lessons</h2>

                <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'all'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('regular')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'regular'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Regular
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'custom'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Custom
                    </button>
                </div>
            </div>

            {filteredLessons.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                >
                    {filteredLessons.map((lesson, index) => (
                        <motion.div
                            key={lesson.id || lesson.lesson_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <LessonCard
                                lesson={lesson}
                                isCompleted={completedLessons.includes(lesson.id || lesson.lesson_id)}
                                index={index}
                                chapterId={actualChapterId}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-md p-8 mb-8 text-center border border-indigo-100"
                >
                    <div className="text-5xl mb-4">📚</div>
                    <p className="text-gray-600 mb-4">No lessons available yet.</p>
                </motion.div>
            )}
        </div>
    );
}

export default ChapterView; 