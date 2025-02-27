import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCurrentLesson, updateChapterProgress, fetchChapterById, fetchLessonById } from '../store/slices/chaptersSlice';
import { completeLesson } from '../store/slices/userSlice';

// Interactive elements for the lesson
function InteractiveElement({ type, content, onComplete }) {
    const [isCompleted, setIsCompleted] = useState(false);

    const handleComplete = () => {
        setIsCompleted(true);
        if (onComplete) onComplete();
    };

    if (type === 'quiz') {
        return (
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 my-6">
                <h3 className="font-medium text-lg mb-4 text-slate-800">Quick Check</h3>
                <p className="mb-4 text-slate-700">{content.question}</p>
                <div className="space-y-2">
                    {content.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                if (index === content.correctIndex) {
                                    handleComplete();
                                }
                            }}
                            className={`w-full p-3 text-left rounded border transition-all ${isCompleted && index === content.correctIndex
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            disabled={isCompleted}
                        >
                            {option}
                            {isCompleted && index === content.correctIndex && (
                                <span className="float-right">✓</span>
                            )}
                        </button>
                    ))}
                </div>
                {isCompleted && (
                    <div className="mt-4 text-green-600">
                        Great job! You got it right.
                    </div>
                )}
            </div>
        );
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
function FormattedContent({ content }) {
    if (!content) return null;

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
        .replace(/black hole/gi, '<span class="font-medium text-slate-900">black hole</span>');

    return (
        <div className="prose prose-lg max-w-none text-slate-700">
            <p className="mb-4 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />
        </div>
    );
}

function ProgressBar({ currentStep, totalSteps }) {
    return (
        <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600">Progress</span>
                <span className="font-medium text-slate-700">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-1.5 bg-slate-500 rounded-full"
                ></motion.div>
            </div>
        </div>
    );
}

// Table of Contents component for lesson navigation
function TableOfContents({ content }) {
    if (!content) return null;

    const sections = [];

    // Extract section titles from content
    const introMatch = content.match(/📚 Introduction/);
    if (introMatch) sections.push({ title: "Introduction", emoji: "📚" });

    const conceptsMatch = content.match(/🎯 Core Concepts/);
    if (conceptsMatch) sections.push({ title: "Core Concepts", emoji: "🎯" });

    // Extract individual concepts
    const conceptTitles = content.match(/📍 ([^\n]+)/g);
    if (conceptTitles) {
        conceptTitles.forEach(match => {
            const title = match.replace("📍 ", "").trim();
            sections.push({ title, emoji: "📍", isSubsection: true });
        });
    }

    const visualsMatch = content.match(/🖼️ Visual Aids/);
    if (visualsMatch) sections.push({ title: "Visual Aids", emoji: "🖼️" });

    const activitiesMatch = content.match(/🎮 Interactive Activities/);
    if (activitiesMatch) sections.push({ title: "Interactive Activities", emoji: "🎮" });

    const summaryMatch = content.match(/📝 Summary/);
    if (summaryMatch) sections.push({ title: "Summary", emoji: "📝" });

    const challengeMatch = content.match(/🏆 Extra Challenge/);
    if (challengeMatch) sections.push({ title: "Extra Challenge", emoji: "🏆" });

    if (sections.length === 0) return null;

    return (
        <div className="bg-white p-5 rounded-lg mb-8 border border-slate-200 shadow-sm">
            <h3 className="font-medium text-lg mb-4 text-slate-800">Contents</h3>
            <ul className="space-y-3">
                {sections.map((section, index) => (
                    <li key={index} className={section.isSubsection ? "ml-5" : ""}>
                        <a
                            href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                            className={`flex items-center hover:text-slate-900 transition-colors ${section.isSubsection ? 'text-sm text-slate-600' : 'text-slate-700 font-medium'}`}
                        >
                            {section.isSubsection ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                            ) : (
                                <span className="mr-2 opacity-80">{section.emoji}</span>
                            )}
                            {section.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function LessonView() {
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(3); // Default: overview, content, summary
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lesson, setLesson] = useState(null);
    const contentRef = useRef(null);

    const { chapterId, lessonId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { chapters, currentChapterId, isLoading: chaptersLoading } = useSelector(state => state.chapters);
    const { completedLessons } = useSelector(state => state.user);

    // Fetch chapter data if not already loaded
    useEffect(() => {
        if (chapterId) {
            setIsLoading(true);
            dispatch(fetchChapterById(chapterId))
                .unwrap()
                .catch(error => {
                    console.error("Error fetching chapter:", error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, chapterId]);

    // Find current chapter - check both id and chapter_id fields
    const chapter = chapters.find(ch =>
        ch.id === chapterId ||
        ch.chapter_id === chapterId ||
        ch.id === currentChapterId ||
        ch.chapter_id === currentChapterId
    );

    // Set current lesson in Redux
    useEffect(() => {
        if (chapter && lessonId) {
            dispatch(setCurrentLesson(lessonId));
        }
    }, [dispatch, chapter, lessonId]);

    // Fetch lesson by ID directly from API
    useEffect(() => {
        if (lessonId) {
            setIsLoading(true);
            dispatch(fetchLessonById(lessonId))
                .unwrap()
                .then(fetchedLesson => {
                    setLesson(fetchedLesson);
                })
                .catch(error => {
                    console.error("Error fetching lesson:", error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, lessonId]);

    // Check if lesson is already completed
    useEffect(() => {
        if (completedLessons.includes(lessonId)) {
            setIsCompleted(true);
        }
    }, [completedLessons, lessonId]);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    // Show loading state
    if (isLoading || chaptersLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600"></div>
            </div>
        );
    }

    // Handle chapter not found
    if (!chapter) {
        return (
            <div className="text-center py-12">
                <h2 className="font-medium text-xl mb-2 text-slate-800">Chapter not found</h2>
                <p className="text-slate-600 mb-4">The chapter you're looking for doesn't exist or couldn't be loaded.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="py-2 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Handle lesson not found
    if (!lesson) {
        return (
            <div className="text-center py-12">
                <h2 className="font-medium text-xl mb-2 text-slate-800">Lesson not found</h2>
                <p className="text-slate-600 mb-4">The lesson you're looking for doesn't exist or couldn't be loaded.</p>
                <button
                    onClick={() => navigate(`/chapters/${chapter.id || chapter.chapter_id}`)}
                    className="py-2 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                    Back to Chapter
                </button>
            </div>
        );
    }

    // Extract lesson objectives and duration from description
    const objectives = [];
    let duration = "30 min";
    let level = "Basic";

    if (lesson.description) {
        const descLines = lesson.description.split('\n');
        const objectivesStartIndex = descLines.findIndex(line => line.includes('Objectives:'));

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

    // Mock interactive elements - in a real app, these would come from the lesson data
    const interactiveElements = [
        {
            type: 'quiz',
            content: {
                question: 'What is the main benefit of memoization?',
                options: [
                    'It makes code more readable',
                    'It reduces memory usage',
                    'It avoids repeating calculations',
                    'It simplifies code structure'
                ],
                correctIndex: 2
            }
        },
        {
            type: 'codeExample',
            content: {
                code: `function fibonacci(n) {\n  const memo = {};\n  \n  function fib(n) {\n    if (n <= 1) return n;\n    if (memo[n]) return memo[n];\n    \n    memo[n] = fib(n-1) + fib(n-2);\n    return memo[n];\n  }\n  \n  return fib(n);\n}`,
                explanation: 'This implementation uses memoization to store previously calculated Fibonacci values, dramatically improving performance.'
            }
        }
    ];

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
        const completedLessons = chapter.lessons.findIndex(l => l.id === lesson.id || l.lesson_id === lesson.id) + 1;
        const progress = Math.round((completedLessons / totalLessons) * 100);

        // Update chapter progress
        dispatch(updateChapterProgress({
            chapterId: chapter.id || chapter.chapter_id,
            progress
        }));

        // Navigate to quiz or next lesson
        const currentLessonIndex = chapter.lessons.findIndex(l => l.id === lesson.id || l.lesson_id === lesson.id);
        if (currentLessonIndex === chapter.lessons.length - 1) {
            // Last lesson, go to quiz
            navigate(`/chapters/${chapter.id || chapter.chapter_id}/quiz`);
        } else {
            // Go to next lesson
            const nextLesson = chapter.lessons[currentLessonIndex + 1];
            navigate(`/chapters/${chapter.id || chapter.chapter_id}/lessons/${nextLesson.id || nextLesson.lesson_id}`);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Overview
                return (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col max-w-2xl mx-auto p-4"
                    >
                        <h2 className="font-medium text-2xl mb-6 text-slate-800">{lesson.title}</h2>

                        {/* Lesson info card */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 w-full">
                            <div className="flex items-center justify-between mb-6">
                                <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                    {lesson.subject}
                                </span>
                                <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                    Grade {lesson.grade}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mb-6 text-slate-600">
                                <span className="text-sm">
                                    <span className="mr-1 opacity-80">⏱️</span> {duration}
                                </span>
                                <span className="text-sm">
                                    <span className="mr-1 opacity-80">📊</span> {level}
                                </span>
                            </div>

                            {objectives.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-medium text-base mb-3 text-slate-700">Learning Objectives</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        {objectives.map((objective, index) => (
                                            <li key={index} className="text-slate-600">{objective}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Lesson image */}
                        <div className="bg-white rounded-lg mb-8 w-full overflow-hidden shadow-sm">
                            <img
                                src={lesson.memeUrl || 'https://via.placeholder.com/600x400?text=Lesson+Visual'}
                                alt={lesson.title}
                                className="w-full object-cover h-64"
                            />
                        </div>

                        <button
                            onClick={handleNextStep}
                            className="py-2.5 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors w-full"
                        >
                            Begin Lesson
                        </button>
                    </motion.div>
                );
            case 2: // Content
                return (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-3xl mx-auto p-4"
                        ref={contentRef}
                    >
                        <div className="bg-white p-8 rounded-lg border border-slate-200 mb-8 shadow-sm">
                            <h1 className="font-medium text-2xl mb-6 text-slate-800">{lesson.title}</h1>

                            {/* Table of Contents */}
                            <TableOfContents content={lesson.content} />

                            {/* Formatted lesson content */}
                            <div className="mb-8">
                                <FormattedContent content={lesson.content} />
                            </div>

                            {/* Interactive elements - simplified */}
                            {interactiveElements.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <h3 className="font-medium text-lg mb-4 text-slate-800">Practice Activities</h3>
                                    {interactiveElements.map((element, index) => (
                                        <InteractiveElement
                                            key={index}
                                            type={element.type}
                                            content={element.content}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={handlePrevStep}
                                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                ← Back to Overview
                            </button>
                            <button
                                onClick={handleNextStep}
                                className="py-2 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                            >
                                Continue to Summary
                            </button>
                        </div>
                    </motion.div>
                );
            case 3: // Summary
                return (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-2xl mx-auto p-4"
                    >
                        <div className="bg-white p-8 rounded-lg border border-slate-200 mb-8 shadow-sm">
                            <h2 className="font-medium text-2xl mb-6 text-slate-800">Summary</h2>

                            <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
                                <h3 className="font-medium text-base mb-4 text-slate-700">Key Takeaways</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    {objectives.map((objective, index) => (
                                        <li key={index} className="text-slate-600">{objective}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                                <h3 className="font-medium text-base mb-2 text-slate-700">Lesson Complete</h3>
                                <p className="text-slate-600 mb-0">
                                    You've finished this lesson. Continue your learning journey!
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={handlePrevStep}
                                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                ← Back to Content
                            </button>
                            <button
                                onClick={handleLessonComplete}
                                className="py-2 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                            >
                                {isCompleted ? 'Next Lesson' : 'Complete & Continue'}
                            </button>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={() => navigate(`/chapters/${chapter.id || chapter.chapter_id}`)}
                    className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
                >
                    <span className="mr-1">←</span> Back to {chapter.title}
                </button>

                {isCompleted && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                    </span>
                )}
            </div>

            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

            <AnimatePresence mode="wait">
                {renderStepContent()}
            </AnimatePresence>
        </div>
    );
}

export default LessonView; 