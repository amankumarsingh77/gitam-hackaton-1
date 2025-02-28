import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import MediaGallery from './MediaGallery';

function LessonSummary({ lesson, objectives, isCompleted, onPrevious, onComplete }) {
    // Trigger confetti effect when component mounts if not already completed
    useEffect(() => {
        if (!isCompleted) {
            try {
                // Dynamically import confetti to avoid SSR issues
                import('canvas-confetti').then((confetti) => {
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;

                    const randomInRange = (min, max) => Math.random() * (max - min) + min;

                    const confettiInterval = setInterval(() => {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(confettiInterval);
                        }

                        // Launch confetti from both sides
                        confetti.default({
                            particleCount: Math.floor(randomInRange(20, 40)),
                            angle: randomInRange(55, 125),
                            spread: randomInRange(50, 70),
                            origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.3, 0.4) },
                            colors: ['#4B5563', '#1E293B', '#0EA5E9', '#10B981', '#8B5CF6'],
                            shapes: ['circle', 'square'],
                            gravity: randomInRange(0.5, 0.7),
                            scalar: randomInRange(0.7, 1.3),
                        });

                        confetti.default({
                            particleCount: Math.floor(randomInRange(20, 40)),
                            angle: randomInRange(55, 125),
                            spread: randomInRange(50, 70),
                            origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.3, 0.4) },
                            colors: ['#4B5563', '#1E293B', '#0EA5E9', '#10B981', '#8B5CF6'],
                            shapes: ['circle', 'square'],
                            gravity: randomInRange(0.5, 0.7),
                            scalar: randomInRange(0.7, 1.3),
                        });
                    }, 250);

                    return () => clearInterval(confettiInterval);
                });
            } catch (error) {
                console.error('Failed to load confetti:', error);
            }
        }
    }, [isCompleted]);

    // Find summary image from media array
    const summaryImage = lesson.media?.find(item =>
        (item.media_type === 'image' || item.media_type === 'meme') &&
        item.description?.toLowerCase().includes('summary')
    );

    return (
        <div className="max-w-3xl mx-auto p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 0.1
                            }}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="font-bold text-3xl text-white mb-2"
                        >
                            Lesson Complete!
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/80 text-lg"
                        >
                            Great job completing {lesson.title}
                        </motion.p>
                    </div>
                </div>

                {/* Summary content */}
                <div className="p-8">
                    {/* Summary image if available */}
                    {summaryImage && (
                        <div className="mb-8 rounded-lg overflow-hidden shadow-md">
                            <img
                                src={summaryImage.url}
                                alt={summaryImage.description || "Lesson summary"}
                                className="w-full h-auto object-contain"
                            />
                            {summaryImage.description && (
                                <div className="p-3 bg-slate-50 text-sm text-slate-600 italic">
                                    {summaryImage.description}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Key takeaways */}
                    {objectives.length > 0 && (
                        <div className="mb-8">
                            <h2 className="font-bold text-xl mb-6 text-slate-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Key Takeaways
                            </h2>

                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                <ul className="space-y-3">
                                    {objectives.map((objective, index) => (
                                        <motion.li
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                                            className="flex items-start"
                                        >
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                            <span className="text-slate-700">{objective}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Media gallery for additional images */}
                    {lesson.media && lesson.media.length > 1 && (
                        <div className="mb-8">
                            <h2 className="font-bold text-xl mb-6 text-slate-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Visual Summary
                            </h2>

                            <MediaGallery
                                media={lesson.media.filter(item =>
                                    item !== summaryImage &&
                                    (item.media_type === 'image' || item.media_type === 'diagram' || item.media_type === 'meme')
                                )}
                            />
                        </div>
                    )}

                    {/* What's next */}
                    <div className="mb-8">
                        <h2 className="font-bold text-xl mb-6 text-slate-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            What's Next
                        </h2>

                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <p className="text-slate-700 mb-0">
                                Continue your learning journey with the next lesson or take a quiz to test your knowledge.
                            </p>
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onPrevious}
                            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center sm:justify-start"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back to Content
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onComplete}
                            className="py-3 px-5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-lg transition-colors flex-1 flex items-center justify-center"
                        >
                            {isCompleted ? (
                                <>
                                    <span>Next Lesson</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Complete & Continue</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LessonSummary; 