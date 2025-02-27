import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TableOfContents from './TableOfContents';
import FormattedContent from './FormattedContent';
import MediaGallery from './MediaGallery';

function LessonContent({ lesson, contentRef, onPrevious, onContinue }) {
    const [activeSection, setActiveSection] = useState('introduction');
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);

    // Show scroll indicator when user hasn't scrolled for a while
    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.scrollY < 100) {
                setShowScrollIndicator(true);

                // Hide after 5 seconds
                setTimeout(() => {
                    setShowScrollIndicator(false);
                }, 5000);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Handle section change for table of contents highlighting
    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
    };

    return (
        <div className="max-w-4xl mx-auto p-4" ref={contentRef}>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar for larger screens */}
                <div className="hidden md:block w-64 flex-shrink-0 relative">
                    <div className="sticky top-24">
                        <TableOfContents
                            content={lesson.content}
                            activeSection={activeSection}
                        />
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 mb-8 shadow-sm">
                        <h1 className="font-bold text-2xl mb-6 text-slate-800">{lesson.title}</h1>

                        {/* Mobile-only table of contents */}
                        <div className="md:hidden mb-6">
                            <TableOfContents
                                content={lesson.content}
                                activeSection={activeSection}
                            />
                        </div>

                        {/* Formatted lesson content */}
                        <div className="mb-8">
                            <FormattedContent
                                content={lesson.content}
                                media={lesson.media}
                                onSectionChange={handleSectionChange}
                            />
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onPrevious}
                            className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back to Overview
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onContinue}
                            className="py-2.5 px-5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-lg transition-colors flex items-center"
                        >
                            Continue to Summary
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            {showScrollIndicator && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center"
                >
                    <span className="mr-2">Scroll down to continue</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </motion.div>
            )}
        </div>
    );
}

export default LessonContent; 