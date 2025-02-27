import React from 'react';
import { motion } from 'framer-motion';

function LessonOverview({ lesson, objectives, duration, level, onContinue }) {
    // Find meme image from media array
    const memeImage = lesson.media?.find(item => item.media_type === 'meme');

    return (
        <div className="flex flex-col max-w-3xl mx-auto p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-10 relative overflow-hidden">
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
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                {lesson.subject}
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                Grade {lesson.grade}
                            </span>
                        </div>

                        <h1 className="font-bold text-3xl text-white mb-2">{lesson.title}</h1>

                        <div className="flex flex-wrap gap-4 mt-4 text-white/80">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{duration}</span>
                            </div>

                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{level}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lesson content */}
                <div className="p-8">
                    {/* Lesson image */}
                    {memeImage && (
                        <div className="mb-8 rounded-lg overflow-hidden shadow-md">
                            <img
                                src={memeImage.url}
                                alt={memeImage.description || lesson.title}
                                className="w-full h-auto object-contain"
                            />
                            {memeImage.description && (
                                <div className="p-3 bg-slate-50 text-sm text-slate-600 italic">
                                    {memeImage.description}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Learning objectives */}
                    {objectives.length > 0 && (
                        <div className="mb-8">
                            <h2 className="font-bold text-xl mb-4 text-slate-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Learning Objectives
                            </h2>

                            <ul className="space-y-3">
                                {objectives.map((objective, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="flex items-start"
                                    >
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-3 mt-0.5">
                                            <span className="text-slate-600 font-medium text-sm">{index + 1}</span>
                                        </span>
                                        <span className="text-slate-700">{objective}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Description */}
                    {lesson.description && (
                        <div className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <h2 className="font-bold text-xl mb-4 text-slate-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                About This Lesson
                            </h2>
                            <p className="text-slate-700 whitespace-pre-line">
                                {lesson.description.split('\n').filter(line =>
                                    !line.includes('Objectives:') &&
                                    !line.startsWith('•') &&
                                    !line.includes('min') &&
                                    !line.includes('|')
                                ).join('\n')}
                            </p>
                        </div>
                    )}

                    {/* Begin button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onContinue}
                        className="w-full py-3 px-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-lg transition-all shadow-sm flex items-center justify-center font-medium"
                    >
                        <span className="mr-2">Begin Lesson</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default LessonOverview; 