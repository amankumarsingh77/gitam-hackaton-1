import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TableOfContents({ content, activeSection }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!content) return null;

    // Extract section titles from content
    const extractSections = () => {
        const sections = [];

        // Introduction section
        const introMatch = content.match(/📚 Introduction|Introduction:/);
        if (introMatch) sections.push({ title: "Introduction", emoji: "📚", id: "introduction" });

        // Core Concepts section
        const conceptsMatch = content.match(/🎯 Core Concepts|Core Concepts:/);
        if (conceptsMatch) sections.push({ title: "Core Concepts", emoji: "🎯", id: "core-concepts" });

        // Extract individual concepts
        const conceptTitles = content.match(/📍 ([^\n]+)/g);
        if (conceptTitles) {
            conceptTitles.forEach(match => {
                const title = match.replace("📍 ", "").trim();
                const id = title.toLowerCase().replace(/\s+/g, '-');
                sections.push({ title, emoji: "📍", id, isSubsection: true });
            });
        }

        // Visual Aids section
        const visualsMatch = content.match(/🖼️ Visual Aids|Visual Aids:/);
        if (visualsMatch) sections.push({ title: "Visual Aids", emoji: "🖼️", id: "visual-aids" });

        // Interactive Activities section
        const activitiesMatch = content.match(/🎮 Interactive Activities|Interactive Activities:/);
        if (activitiesMatch) sections.push({ title: "Interactive Activities", emoji: "🎮", id: "interactive-activities" });

        // Summary section
        const summaryMatch = content.match(/📝 Summary|Summary:/);
        if (summaryMatch) sections.push({ title: "Summary", emoji: "📝", id: "summary" });

        // Extra Challenge section
        const challengeMatch = content.match(/🏆 Extra Challenge|Extra Challenge:/);
        if (challengeMatch) sections.push({ title: "Extra Challenge", emoji: "🏆", id: "extra-challenge" });

        return sections;
    };

    const sections = extractSections();

    if (sections.length === 0) return null;

    return (
        <div className="bg-white p-5 rounded-lg mb-8 border border-slate-200 shadow-sm">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-bold text-lg text-slate-800">Contents</h3>
                <button className="text-slate-500 hover:text-slate-700 transition-colors">
                    {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <ul className="space-y-3 mt-4">
                            {sections.map((section, index) => (
                                <li
                                    key={index}
                                    className={section.isSubsection ? "ml-5" : ""}
                                >
                                    <a
                                        href={`#${section.id}`}
                                        className={`flex items-center transition-colors ${activeSection === section.id
                                                ? 'text-slate-900 font-medium'
                                                : section.isSubsection
                                                    ? 'text-slate-600 hover:text-slate-800'
                                                    : 'text-slate-700 hover:text-slate-900 font-medium'
                                            }`}
                                    >
                                        {section.isSubsection ? (
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                                        ) : (
                                            <span className="mr-2 opacity-80">{section.emoji}</span>
                                        )}
                                        {section.title}

                                        {activeSection === section.id && (
                                            <motion.span
                                                layoutId="activeIndicator"
                                                className="ml-2 w-1.5 h-1.5 rounded-full bg-slate-700"
                                            />
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TableOfContents; 