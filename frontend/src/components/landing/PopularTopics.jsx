import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const PopularTopics = () => {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">Popular Topics</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">
                        Diverse Learning Paths
                    </h2>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Explore our balanced collection of programming and academic subjects, all designed with the same level of care and creativity.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Programming Topic */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden shadow-md border border-slate-100"
                    >
                        <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900">Programming</h3>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Master coding concepts through JavaScript, Python, React, and more with our engaging meme-based lessons.
                            </p>
                            <div className="flex items-center text-sm text-slate-500">
                                <span className="flex items-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    50+ Lessons
                                </span>
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    3.2k Students
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Science Topic */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl overflow-hidden shadow-md border border-slate-100"
                    >
                        <div className="h-3 bg-gradient-to-r from-green-500 to-teal-500"></div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900">Science</h3>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Explore biology, chemistry, physics, and environmental science through engaging visual content.
                            </p>
                            <div className="flex items-center text-sm text-slate-500">
                                <span className="flex items-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    45+ Lessons
                                </span>
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    3.4k Students
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mathematics Topic */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden shadow-md border border-slate-100"
                    >
                        <div className="h-3 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900">Mathematics</h3>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Learn algebra, calculus, statistics, and geometry through relatable and humorous content.
                            </p>
                            <div className="flex items-center text-sm text-slate-500">
                                <span className="flex items-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    40+ Lessons
                                </span>
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    3.5k Students
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Humanities Topic */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl overflow-hidden shadow-md border border-slate-100"
                    >
                        <div className="h-3 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900">Humanities</h3>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Discover history, literature, philosophy, and social studies through memorable meme content.
                            </p>
                            <div className="flex items-center text-sm text-slate-500">
                                <span className="flex items-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    35+ Lessons
                                </span>
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    2.8k Students
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Languages Topic */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl overflow-hidden shadow-md border border-slate-100"
                    >
                        <div className="h-3 bg-gradient-to-r from-red-500 to-rose-500"></div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900">Languages</h3>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Learn Spanish, French, Japanese, and other languages through culturally relevant memes.
                            </p>
                            <div className="flex items-center text-sm text-slate-500">
                                <span className="flex items-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    30+ Lessons
                                </span>
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    2.6k Students
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Professional Skills Topic */}
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-xl overflow-hidden shadow-md border border-slate-100"
                    >
                        <div className="h-3 bg-gradient-to-r from-cyan-500 to-sky-500"></div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-600 mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900">Professional Skills</h3>
                            </div>
                            <p className="text-slate-600 mb-4">
                                Develop critical thinking, communication, leadership, and project management skills.
                            </p>
                            <div className="flex items-center text-sm text-slate-500">
                                <span className="flex items-center mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    25+ Lessons
                                </span>
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    2.2k Students
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="text-center mt-12">
                    <Link
                        to="/topics"
                        className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-3 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        Explore All Topics <FiArrowRight className="ml-2" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default PopularTopics;
