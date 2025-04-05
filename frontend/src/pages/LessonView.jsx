import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCurrentLesson, updateChapterProgress, fetchChapterById, fetchLessonById } from '../store/slices/chaptersSlice';
import { completeLesson } from '../store/slices/userSlice';

// ===== Component Imports =====
import LessonHeader from '../components/lesson/LessonHeader';
import LessonOverview from '../components/lesson/LessonOverview';
import LessonContent from '../components/lesson/LessonContent';
import LessonSummary from '../components/lesson/LessonSummary';
import LessonQuiz from '../components/lesson/LessonQuiz';
import ProgressBar from '../components/lesson/ProgressBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Interactive elements for the lesson
function InteractiveElement({ type, content, onComplete }) {
    const [isCompleted, setIsCompleted] = useState(false);
    const dispatch = useDispatch();

    const handleComplete = () => {
        setIsCompleted(true);
        if (onComplete) onComplete();
    };

    if (type === 'quiz') {
        return <LessonQuiz quiz={content} onComplete={handleComplete} />;
    }

    if (type === 'codeExample') {
        return (
            <div className="bg-slate-800 text-slate-100 p-6 rounded-lg my-6 font-mono text-sm overflow-x-auto">
                <pre>{content.code}</pre>
                {content.explanation && (
                    <div className="mt-4 bg-slate-700 p-4 rounded border-l-2 border-slate-500 text-slate-200">
                        {content.explanation}
                    </div>
                )}
            </div>
        );
    }

    return null;
}

// Format lesson content with emojis and styling
function FormattedContent({ content, onQuizComplete }) {
    const [completedQuizzes, setCompletedQuizzes] = useState([]);

    useEffect(() => {
        // Check if all quizzes are completed
        const quizzes = extractQuizzes(content);
        if (quizzes.length > 0 && completedQuizzes.length === quizzes.length) {
            // All quizzes completed
            if (onQuizComplete) {
                onQuizComplete();
            }
        }
    }, [completedQuizzes, content, onQuizComplete]);

    if (!content) return null;

    // Extract quiz data from content
    const extractQuizzes = (content) => {
        const quizzes = [];
        const quizRegex = /🎮[\s\S]*?Quiz:[\s\S]*?Question: (.*?)[\s\S]*?Options:[\s\S]*?((?:- .*?\n)+)[\s\S]*?Correct Answer: (.*?)[\s\S]*?Explanation: (.*?)(?=\n\n|$)/g;

        let match;
        while ((match = quizRegex.exec(content)) !== null) {
            const question = match[1].trim();
            const optionsText = match[2];
            const correctAnswer = match[3].trim();
            const explanation = match[4].trim();

            // Parse options
            const options = optionsText.split('\n')
                .filter(line => line.trim().startsWith('- '))
                .map(line => line.trim().substring(2).trim());

            // Find correct index
            const correctIndex = options.findIndex(option =>
                option.toLowerCase() === correctAnswer.toLowerCase());

            if (correctIndex !== -1) {
                quizzes.push({
                    question,
                    options,
                    correctIndex,
                    explanation
                });
            }
        }

        return quizzes;
    };

    // Extract quizzes from content
    const quizzes = extractQuizzes(content);

    // Handle quiz completion
    const handleQuizComplete = (index) => {
        if (!completedQuizzes.includes(index)) {
            setCompletedQuizzes(prev => [...prev, index]);
        }
    };

    // Process content to handle emojis, headers, and other formatting
    const processedContent = content
        // Replace emoji indicators with actual emojis and add proper styling with section IDs
        .replace(/📚/g, '<div id="introduction" class="mb-8"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📚</span>Introduction</h3>')
        .replace(/🎯/g, '<div id="core-concepts" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎯</span>Core Concepts</h3>')
        .replace(/📍 ([^:\n]+):/g, (match, title) => {
            const id = title.toLowerCase().replace(/\s+/g, '-');
            return `<div id="${id}" class="mb-6"><h4 class="font-medium text-lg mb-3 text-slate-800 flex items-center"><span class="text-xl mr-2 opacity-80">📍</span>${title}</h4>`;
        })
        .replace(/🌟/g, '<div class="bg-white p-5 rounded-lg my-6 border border-slate-200 shadow-sm"><div class="flex items-start"><span class="text-xl mr-3 text-amber-500 mt-0.5">✨</span><div class="flex-1"><h4 class="font-medium text-lg mb-2 text-slate-800">Real-World Example</h4><div class="text-slate-700">')
        .replace(/💡/g, '<div class="bg-amber-50 p-5 rounded-lg my-6 border border-amber-100"><div class="flex items-start"><span class="text-xl mr-3 text-amber-500 mt-0.5">💡</span><div class="flex-1"><h4 class="font-medium text-lg mb-2 text-slate-800">Fun Fact</h4><div class="text-slate-700">')
        .replace(/🖼️/g, '<div id="visual-aids" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🖼️</span>Visual Aids</h3>')
        .replace(/🎮/g, '<div id="interactive-activities" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎮</span>Interactive Activities</h3>')
        .replace(/🔸 ([^:\n]+):/g, (match, title) => {
            const id = title.toLowerCase().replace(/\s+/g, '-');
            return `<div id="${id}" class="mb-6"><h4 class="font-medium text-lg mb-3 text-slate-800 flex items-center"><span class="text-amber-500 mr-2">●</span>${title}</h4>`;
        })
        .replace(/📝/g, '<div id="summary" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📝</span>Summary</h3>')

        // Close the divs for elements that need closing
        .replace(/:\n/g, '\n</div>')

        // Add closing divs for special elements
        .replace(/💡[\s\S]*?(?=<div|$)/g, match => `${match}</div></div></div>`)
        .replace(/🌟[\s\S]*?(?=<div|$)/g, match => `${match}</div></div></div>`)

        // Format headers and sections that might not have emojis
        .replace(/Introduction:/g, '<div id="introduction" class="mb-8"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📚</span>Introduction</h3>')
        .replace(/Core Concepts:/g, '<div id="core-concepts" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎯</span>Core Concepts</h3>')
        .replace(/Visual Aids:/g, '<div id="visual-aids" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🖼️</span>Visual Aids</h3>')
        .replace(/Interactive Activities:/g, '<div id="interactive-activities" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎮</span>Interactive Activities</h3>')
        .replace(/Summary:/g, '<div id="summary" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📝</span>Summary</h3>')
        .replace(/Extra Challenge:/g, '<div id="extra-challenge" class="mb-8 mt-10"><h3 class="font-medium text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🏆</span>Extra Challenge</h3>')

        // Format subsections
        .replace(/Materials needed:/g, '<h5 class="font-medium text-base mb-2 text-slate-700">Materials needed:</h5>')
        .replace(/What you'll learn:/g, '<h5 class="font-medium text-base mb-2 text-slate-700">What you\'ll learn:</h5>')

        // Format lists with better styling
        .replace(/- /g, '<li class="mb-2 text-slate-700 flex items-start"><span class="inline-block w-2 h-2 rounded-full bg-slate-400 mr-2 mt-2"></span><span>')
        .replace(/\n(?=<li)/g, '</span></li>\n')
        .replace(/<li(.*?)<\/li>/g, match => {
            if (!match.includes('</span></li>')) {
                return match.replace(/<\/li>/, '</span></li>');
            }
            return match;
        })

        // Add paragraph spacing
        .replace(/\n\n/g, '</p><p class="mb-4 text-slate-700 leading-relaxed">')

        // Wrap code blocks
        .replace(/```([^`]+)```/g, '<pre class="bg-slate-800 text-slate-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm">$1</pre>')

        // Format inline code
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')

        // Add special styling for event horizon and other key terms
        .replace(/📍 Event Horizon:/g, '<div id="event-horizon" class="mb-6"><h4 class="font-medium text-lg mb-3 text-slate-800 flex items-center"><span class="text-red-500 mr-2">●</span>Event Horizon</h4>')
        .replace(/black hole/gi, '<span class="font-medium text-slate-900">black hole</span>')

        // Remove quiz content since we'll render it separately
        .replace(/Quiz:[\s\S]*?Question: .*?[\s\S]*?Options:[\s\S]*?(?:- .*?\n)+[\s\S]*?Correct Answer: .*?[\s\S]*?Explanation: .*?(?=\n\n|$)/g, '');

    return (
        <div className="prose prose-lg max-w-none text-slate-700">
            <p className="mb-4 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />

            {/* Render quizzes */}
            {quizzes.map((quiz, index) => (
                <InteractiveElement
                    key={`quiz-${index}`}
                    type="quiz"
                    content={quiz}
                    onComplete={() => handleQuizComplete(index)}
                />
            ))}
        </div>
    );
}

// ===== Animation Variants =====
const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeInOut' }
};

function LessonView() {
    // ===== State Management =====
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(3); // Overview, Content, Summary
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lesson, setLesson] = useState(null);
    const [error, setError] = useState(null);
    const contentRef = useRef(null);

    // ===== Hooks =====
    const { chapterId, lessonId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ===== Redux Selectors =====
    const { chapters, currentChapterId, isLoading: chaptersLoading } = useSelector(state => state.chapters);
    const { completedLessons } = useSelector(state => state.user);

    // ===== Fetch Chapter Data =====
    useEffect(() => {
        if (chapterId) {
            setIsLoading(true);
            setError(null);

            dispatch(fetchChapterById(chapterId))
                .unwrap()
                .catch(error => {
                    console.error("Error fetching chapter:", error);
                    setError("Failed to load chapter data. Please try again later.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, chapterId]);

    // ===== Find Current Chapter =====
    const chapter = chapters.find(ch =>
        ch.id === chapterId ||
        ch.chapter_id === chapterId ||
        ch.id === currentChapterId ||
        ch.chapter_id === currentChapterId
    );

    // ===== Set Current Lesson in Redux =====
    useEffect(() => {
        if (chapter && lessonId) {
            dispatch(setCurrentLesson(lessonId));
        }
    }, [dispatch, chapter, lessonId]);

    // ===== Fetch Lesson Data =====
    useEffect(() => {
        if (lessonId) {
            setIsLoading(true);
            setError(null);

            dispatch(fetchLessonById(lessonId))
                .unwrap()
                .then(fetchedLesson => {
                    setLesson(fetchedLesson);
                })
                .catch(error => {
                    console.error("Error fetching lesson:", error);
                    setError("Failed to load lesson data. Please try again later.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, lessonId]);

    // ===== Check if Lesson is Completed =====
    useEffect(() => {
        if (completedLessons.includes(lessonId)) {
            setIsCompleted(true);
        }
    }, [completedLessons, lessonId]);

    // ===== Scroll to Top on Step Change =====
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // ===== Navigation Handlers =====
    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleLessonComplete = () => {
        // Mark lesson as completed in redux
        if (!isCompleted) {
            dispatch(completeLesson(lesson.id || lesson.lesson_id));
            setIsCompleted(true);
        }

        // Calculate progress
        const totalLessons = chapter.lessons.length;
        const completedLessons = chapter.lessons.findIndex(l =>
            l.id === lesson.id || l.lesson_id === lesson.id
        ) + 1;
        const progress = Math.round((completedLessons / totalLessons) * 100);

        // Update chapter progress
        dispatch(updateChapterProgress({
            chapterId: chapter.id || chapter.chapter_id,
            progress
        }));

        // Navigate to quiz or next lesson
        const currentLessonIndex = chapter.lessons.findIndex(l =>
            l.id === lesson.id || l.lesson_id === lesson.id
        );

        if (currentLessonIndex === chapter.lessons.length - 1) {
            // Last lesson, go to quiz
            navigate(`/chapters/${chapter.id || chapter.chapter_id}/quiz`);
        } else {
            // Go to next lesson
            const nextLesson = chapter.lessons[currentLessonIndex + 1];
            navigate(`/chapters/${chapter.id || chapter.chapter_id}/lessons/${nextLesson.id || nextLesson.lesson_id}`);
        }
    };

    // ===== Loading State =====
    if (isLoading || chaptersLoading) {
        return <LoadingSpinner />;
    }

    // ===== Error State =====
    if (error) {
        return <ErrorMessage message={error} />;
    }

    // ===== Chapter Not Found =====
    if (!chapter) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-md">
                    <h2 className="font-bold text-xl mb-3 text-red-700">Chapter Not Found</h2>
                    <p className="text-slate-700 mb-6">
                        The chapter you're looking for doesn't exist or couldn't be loaded.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors inline-flex items-center"
                    >
                        <span className="mr-2">←</span> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ===== Lesson Not Found =====
    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg max-w-md">
                    <h2 className="font-bold text-xl mb-3 text-amber-700">Lesson Not Found</h2>
                    <p className="text-slate-700 mb-6">
                        The lesson you're looking for doesn't exist or couldn't be loaded.
                    </p>
                    <button
                        onClick={() => navigate(`/chapters/${chapter.id || chapter.chapter_id}`)}
                        className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors inline-flex items-center"
                    >
                        <span className="mr-2">←</span> Back to Chapter
                    </button>
                </div>
            </div>
        );
    }

    // ===== Extract Lesson Metadata =====
    const extractLessonMetadata = () => {
        const objectives = [];
        let duration = "30 min";
        let level = "Basic";

        if (lesson.description) {
            const descLines = lesson.description.split('\n');
            const objectivesStartIndex = descLines.findIndex(line =>
                line.includes('Objectives:')
            );

            if (objectivesStartIndex !== -1) {
                for (let i = objectivesStartIndex + 1; i < descLines.length; i++) {
                    const line = descLines[i].trim();
                    if (line.startsWith('•')) {
                        objectives.push(line.substring(1).trim());
                    }
                    if (line.includes('min') && line.includes('|')) {
                        const parts = line.split('|');
                        duration = parts[0].trim();
                        level = parts[1].trim();
                        break;
                    }
                }
            }
        }

        return { objectives, duration, level };
    };

    const { objectives, duration, level } = extractLessonMetadata();

    // ===== Render Step Content =====
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Overview
                return (
                    <LessonOverview
                        lesson={lesson}
                        objectives={objectives}
                        duration={duration}
                        level={level}
                        onContinue={handleNextStep}
                    />
                );
            case 2: // Content
                return (
                    <LessonContent
                        lesson={lesson}
                        contentRef={contentRef}
                        onPrevious={handlePrevStep}
                        onContinue={handleNextStep}
                        onQuizComplete={() => {
                            // Mark lesson as partially completed when quizzes are done
                            if (!isCompleted) {
                                dispatch(updateChapterProgress({
                                    chapterId: chapter.id || chapter.chapter_id,
                                    progress: 50 // Partial progress
                                }));
                            }
                        }}
                    />
                );
            case 3: // Summary
                return (
                    <LessonSummary
                        lesson={lesson}
                        objectives={objectives}
                        isCompleted={isCompleted}
                        onPrevious={handlePrevStep}
                        onComplete={handleLessonComplete}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <LessonHeader
                chapter={chapter}
                isCompleted={isCompleted}
                onBack={() => navigate(`/chapters/${chapter.id || chapter.chapter_id}`)}
            />

            <div className="mb-8">
                <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`step-${currentStep}`}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageTransition}
                >
                    {renderStepContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default LessonView; 