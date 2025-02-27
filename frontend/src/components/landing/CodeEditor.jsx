import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Renamed component to better reflect its purpose
const LearningDashboard = () => {
    const [activeSubject, setActiveSubject] = useState(0);
    const [memeVisible, setMemeVisible] = useState(false);

    // Subject data with equal representation but more subtle colors
    const subjects = [
        {
            name: 'Programming',
            icon: 'JS',
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            meme: 'When your code works on the first try',
            concept: 'Variables & Functions',
            xpGained: 120,
            progress: 75
        },
        {
            name: 'Mathematics',
            icon: 'Math',
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            meme: 'When you finally understand calculus',
            concept: 'Quadratic Equations',
            xpGained: 135,
            progress: 68
        },
        {
            name: 'Science',
            icon: 'Sci',
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
            meme: 'Mitochondria is the powerhouse of the cell',
            concept: 'Cell Biology',
            xpGained: 110,
            progress: 82
        },
        {
            name: 'Humanities',
            icon: 'Hum',
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
            meme: 'Renaissance art vs. Modern art',
            concept: 'Historical Movements',
            xpGained: 95,
            progress: 63
        },
        {
            name: 'Languages',
            icon: 'Lang',
            color: 'from-rose-500 to-rose-600',
            textColor: 'text-rose-600',
            bgColor: 'bg-rose-50',
            meme: 'When you use a new phrase correctly',
            concept: 'Conversation Basics',
            xpGained: 105,
            progress: 70
        }
    ];

    // Auto-rotate through subjects
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSubject((prev) => (prev + 1) % subjects.length);
            setMemeVisible(false);
            setTimeout(() => setMemeVisible(true), 300);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // Show meme after initial load
    useEffect(() => {
        const timer = setTimeout(() => setMemeVisible(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const currentSubject = subjects[activeSubject];

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-100">
            {/* Header with subject tabs - updated design with lighter colors */}
            <div className="flex bg-slate-100">
                {subjects.map((subject, index) => (
                    <button
                        key={index}
                        className={`flex-1 py-3 px-2 text-center transition-all duration-300 ${activeSubject === index
                            ? `${subject.bgColor} ${subject.textColor} font-medium border-b-2 border-${subject.textColor.replace('text-', '')}`
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-700'
                            }`}
                        onClick={() => {
                            setActiveSubject(index);
                            setMemeVisible(false);
                            setTimeout(() => setMemeVisible(true), 300);
                        }}
                    >
                        <span className="text-sm md:text-base">{subject.icon}</span>
                    </button>
                ))}
            </div>

            {/* Main content area - cleaner design */}
            <div className="p-5">
                {/* Subject title - more subtle */}
                <motion.div
                    key={`title-${activeSubject}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between mb-4"
                >
                    <h3 className={`text-lg font-medium ${currentSubject.textColor}`}>
                        {currentSubject.name} Learning
                    </h3>
                    <div className="flex items-center bg-slate-100 rounded-full px-2 py-1">
                        <span className="text-slate-600 text-xs">Level 4</span>
                        <div className={`ml-1.5 w-3 h-3 rounded-full bg-gradient-to-r ${currentSubject.color}`}></div>
                    </div>
                </motion.div>

                {/* Meme learning card - less overwhelming */}
                <motion.div
                    key={`meme-${activeSubject}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{
                        opacity: memeVisible ? 1 : 0,
                        scale: memeVisible ? 1 : 0.98
                    }}
                    transition={{ duration: 0.4 }}
                    className={`${currentSubject.bgColor} border border-${currentSubject.textColor.replace('text-', '')}/20 rounded-lg p-4 mb-5`}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className={`${currentSubject.textColor} text-sm font-medium`}>
                            Today's Meme Lesson
                        </div>
                        <div className={`${currentSubject.bgColor} w-7 h-7 flex items-center justify-center text-sm ${currentSubject.textColor}`}>
                            {currentSubject.icon}
                        </div>
                    </div>

                    <div className="text-base font-medium text-slate-800 mb-2">"{currentSubject.meme}"</div>
                    <div className="text-slate-600 text-sm mb-3">Learning: {currentSubject.concept}</div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="bg-white/80 rounded-full px-2 py-0.5 text-xs border border-slate-200 text-slate-700">
                                +{currentSubject.xpGained} XP
                            </div>
                        </div>
                        <button className={`${currentSubject.textColor} bg-white hover:bg-${currentSubject.textColor.replace('text-', '')}/10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}>
                            Start Learning
                        </button>
                    </div>
                </motion.div>

                {/* Progress section - more subtle */}
                <div className="mb-5">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Your Progress</span>
                        <span>{currentSubject.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                        <motion.div
                            key={`progress-${activeSubject}`}
                            className={`h-2 rounded-full bg-gradient-to-r ${currentSubject.color}`}
                            initial={{ width: "0%" }}
                            animate={{ width: `${currentSubject.progress}%` }}
                            transition={{ duration: 0.8 }}
                        ></motion.div>
                    </div>
                </div>

                {/* Learning path - simplified */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-slate-700 text-sm mb-2.5">Learning Path</h4>
                    <div className="space-y-2.5">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={`path-${activeSubject}-${i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.1 }}
                                className="flex items-center"
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === 0
                                    ? `bg-gradient-to-r ${currentSubject.color} text-white`
                                    : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="ml-2.5 flex-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-medium text-slate-700">
                                            {i === 0 ? 'Basics' : i === 1 ? 'Intermediate' : 'Advanced'}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {i === 0 ? 'Completed' : i === 1 ? 'In Progress' : 'Locked'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                                        <div
                                            className={`h-1 rounded-full bg-gradient-to-r ${currentSubject.color}`}
                                            style={{ width: i === 0 ? '100%' : i === 1 ? '45%' : '0%' }}
                                        ></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer stats - simplified */}
                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                    <div className="text-center">
                        <div className="text-xs text-slate-500">Total XP</div>
                        <div className="text-sm font-medium text-slate-800">1,240</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500">Streak</div>
                        <div className="text-sm font-medium text-slate-800">5 days</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500">Memes</div>
                        <div className="text-sm font-medium text-slate-800">42</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningDashboard;
