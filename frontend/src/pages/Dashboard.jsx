import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setCurrentChapter, fetchChaptersBySubject, generateChapterWithAI, createCustomChapter } from '../store/slices/chaptersSlice';
import QuizProgress from '../components/common/QuizProgress';

// Components
function ChapterCard({ chapter, onClick }) {
    const { completedLessons, completedQuizzes } = useSelector(state => state.user);

    // Calculate progress
    const totalItems = chapter.lessons?.length + 1 || 1; // +1 for quiz
    const completedItems =
        (chapter.lessons?.filter(lesson => completedLessons?.includes(lesson.id))?.length || 0) +
        (completedQuizzes?.includes(chapter.quiz?.id) ? 1 : 0);

    const progress = Math.round((completedItems / totalItems) * 100);

    // Get subject-specific gradient
    const getSubjectGradient = () => {
        switch (chapter.subject) {
            case 'math':
                return 'from-blue-500 to-indigo-600';
            case 'science':
                return 'from-emerald-500 to-teal-600';
            case 'history':
                return 'from-amber-500 to-orange-600';
            case 'english':
                return 'from-purple-500 to-violet-600';
            case 'programming':
                return 'from-cyan-500 to-sky-600';
            default:
                return 'from-indigo-500 to-purple-600';
        }
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all"
            onClick={onClick}
        >
            <div className={`h-48 bg-gradient-to-r ${getSubjectGradient()} relative overflow-hidden`}>
                {chapter.thumbnail ? (
                    <img
                        src={chapter.thumbnail}
                        alt={chapter.title}
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl text-white font-heading font-bold">
                            {chapter.title.charAt(0)}
                        </span>
                    </div>
                )}

                {chapter.isPreBuilt && (
                    <div className="absolute top-3 right-3 bg-white text-indigo-600 py-1 px-3 rounded-full text-xs font-bold shadow-md">
                        Official
                    </div>
                )}
            </div>

            <div className="p-6 bg-white border-t-4 border-indigo-100">
                <h3 className="font-heading font-bold text-xl text-gray-800">{chapter.title}</h3>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{chapter.description}</p>

                <div className="mt-5">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Progress</span>
                        <span className="text-indigo-600 font-bold">{progress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getSubjectGradient()} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {chapter.quiz && (
                    <div className="mt-4">
                        <QuizProgress chapter={chapter} showButton={false} compact={true} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function CreateChapterModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: 'math',
        grade: 10,
        isAIGenerated: false,
        prompt: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    // Get subject-specific gradient
    const getSubjectGradient = (subject) => {
        switch (subject) {
            case 'math':
                return 'from-blue-500 to-indigo-600';
            case 'science':
                return 'from-emerald-500 to-teal-600';
            case 'history':
                return 'from-amber-500 to-orange-600';
            case 'english':
                return 'from-purple-500 to-violet-600';
            case 'programming':
                return 'from-cyan-500 to-sky-600';
            default:
                return 'from-indigo-500 to-purple-600';
        }
    };

    // Get subject icon
    const getSubjectIcon = (subject) => {
        switch (subject) {
            case 'math': return '📐';
            case 'science': return '🔬';
            case 'history': return '📜';
            case 'english': return '📚';
            case 'programming': return '💻';
            default: return '📚';
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (formData.isAIGenerated) {
                // Generate chapter with AI
                await dispatch(generateChapterWithAI({
                    prompt: formData.prompt,
                    subject: formData.subject,
                    grade: parseInt(formData.grade, 10)
                })).unwrap();
            } else {
                // Create custom chapter
                await dispatch(createCustomChapter({
                    title: formData.title,
                    description: formData.description,
                    subject: formData.subject,
                    grade: parseInt(formData.grade, 10),
                    user_id: user?.id
                })).unwrap();
            }

            onSuccess();
        } catch (error) {
            setError(typeof error === 'object' ? (error.message || JSON.stringify(error)) : error || 'Failed to create chapter');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-indigo-100 overflow-hidden"
            >
                {/* Header with gradient background */}
                <div className={`bg-gradient-to-r ${getSubjectGradient(formData.subject)} p-6 text-white`}>
                    <div className="flex items-center">
                        <div className="bg-white/20 p-3 rounded-xl mr-4 backdrop-blur-sm">
                            {formData.isAIGenerated ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {formData.isAIGenerated ? 'AI-Generated Chapter' : 'Custom Chapter'}
                            </h3>
                            <p className="text-white/80 text-sm">
                                {formData.isAIGenerated
                                    ? 'Let AI create a complete chapter based on your prompt'
                                    : 'Create your own custom chapter from scratch'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-600 px-4 py-3 rounded-lg flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* AI Generation Toggle */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-lg mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <label className="text-gray-800 font-medium">Generate with AI</label>
                                        <p className="text-gray-500 text-xs">Let AI create content for you</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isAIGenerated"
                                        checked={formData.isAIGenerated}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="min-h-[220px]">
                            {formData.isAIGenerated ? (
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Topic Prompt
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            name="prompt"
                                            value={formData.prompt}
                                            onChange={handleChange}
                                            placeholder="e.g., Introduction to Quadratic Equations"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            rows="4"
                                            required
                                        />
                                        <div className="absolute bottom-3 right-3 text-indigo-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Describe the topic you want to learn about
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Chapter title"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                            </svg>
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Brief description of the chapter"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            rows="4"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    Subject
                                </label>
                                <div className="relative">
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none"
                                        required
                                    >
                                        <option value="math">Math</option>
                                        <option value="science">Science</option>
                                        <option value="history">History</option>
                                        <option value="english">English</option>
                                        <option value="programming">Programming</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-xl">{getSubjectIcon(formData.subject)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Grade
                                </label>
                                <div className="relative">
                                    <select
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none"
                                        required
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                Grade {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview card */}
                        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                            </h4>
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getSubjectGradient(formData.subject)} flex items-center justify-center text-white mr-3`}>
                                    <span>{getSubjectIcon(formData.subject)}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800">
                                        {formData.isAIGenerated
                                            ? (formData.prompt ? formData.prompt.substring(0, 30) + (formData.prompt.length > 30 ? '...' : '') : 'AI Generated Chapter')
                                            : (formData.title || 'Chapter Title')}
                                    </h3>
                                    <p className="text-xs text-gray-500">Grade {formData.grade} · {formData.subject.charAt(0).toUpperCase() + formData.subject.slice(1)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (formData.isAIGenerated && !formData.prompt) || (!formData.isAIGenerated && (!formData.title || !formData.description))}
                                className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center ${isSubmitting || (formData.isAIGenerated && !formData.prompt) || (!formData.isAIGenerated && (!formData.title || !formData.description))
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : `bg-gradient-to-r ${getSubjectGradient(formData.subject)} text-white hover:shadow-lg`
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {formData.isAIGenerated ? 'Generating...' : 'Creating...'}
                                    </span>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        {formData.isAIGenerated ? 'Generate Chapter' : 'Create Chapter'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('math');
    const dispatch = useDispatch();
    const { chapters, isLoading, error } = useSelector(state => state.chapters);
    const { user } = useSelector(state => state.auth);

    console.log(user);

    // Fetch chapters when component mounts or subject changes
    useEffect(() => {
        if (user?.grade) {
            dispatch(fetchChaptersBySubject({
                subject: selectedSubject,
                grade: user.grade
            }));
        }
    }, [dispatch, user, selectedSubject]);

    const handleChapterClick = (chapterId) => {
        dispatch(setCurrentChapter(chapterId));
    };

    const handleCreateSuccess = () => {
        setIsModalOpen(false);
        // Refresh chapters
        if (user?.grade) {
            dispatch(fetchChaptersBySubject({
                subject: selectedSubject,
                grade: user.grade
            }));
        }
    };

    const subjects = [
        { id: 'math', name: 'Math', icon: '📐', color: 'from-blue-500 to-indigo-600' },
        { id: 'science', name: 'Science', icon: '🔬', color: 'from-emerald-500 to-teal-600' },
        { id: 'history', name: 'History', icon: '📜', color: 'from-amber-500 to-orange-600' },
        { id: 'english', name: 'English', icon: '📚', color: 'from-purple-500 to-violet-600' },
        { id: 'programming', name: 'Programming', icon: '💻', color: 'from-cyan-500 to-sky-600' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header with improved styling */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-4 px-6 py-10 mb-10 rounded-b-3xl shadow-lg">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                    <div>
                        <h1 className="font-heading font-bold text-4xl text-white">My Learning Journey</h1>
                        <p className="text-indigo-100 mt-2 text-lg">Continue your educational adventure with fun and interactive content</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white hover:bg-indigo-50 text-indigo-600 font-medium py-3 px-6 rounded-xl flex items-center transition-colors shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Chapter
                    </button>
                </motion.div>
            </div>

            {/* Subject Tabs with improved styling */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-10 overflow-x-auto py-2"
            >
                <div className="flex space-x-3">
                    {subjects.map(subject => (
                        <button
                            key={subject.id}
                            onClick={() => setSelectedSubject(subject.id)}
                            className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center ${selectedSubject === subject.id
                                ? `bg-gradient-to-r ${subject.color} text-white shadow-md`
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
                                }`}
                        >
                            <span className="mr-2">{subject.icon}</span>
                            {subject.name}
                        </button>
                    ))}
                </div>
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl mb-8"
                >
                    <span className="block sm:inline">{typeof error === 'object' ? JSON.stringify(error) : error}</span>
                </motion.div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="relative w-20 h-20">
                        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-200"></div>
                        <div className="absolute top-0 left-0 w-full h-full rounded-full border-t-4 border-indigo-600 animate-spin"></div>
                    </div>
                </div>
            ) : (
                <>
                    {chapters && chapters.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {chapters.map((chapter, index) => (
                                <motion.div
                                    key={chapter.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                                >
                                    <Link
                                        to={`/chapters/${chapter.chapter_id}`}
                                        className="block"
                                    >
                                        <ChapterCard
                                            chapter={chapter}
                                            onClick={() => handleChapterClick(chapter.id)}
                                        />
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-center py-16 bg-white rounded-xl border border-indigo-100 shadow-md"
                        >
                            <div className="max-w-md mx-auto">
                                <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h2 className="font-heading font-bold text-2xl mb-3 text-gray-800">No chapters found</h2>
                                <p className="text-gray-600 mb-8">
                                    Create your first AI-generated chapter or check out our pre-built content.
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl inline-flex items-center transition-colors shadow-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Create Your First Chapter
                                </button>
                            </div>
                        </motion.div>
                    )}
                </>
            )}

            <CreateChapterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
}

export default Dashboard;