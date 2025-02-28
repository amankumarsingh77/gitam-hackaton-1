import { motion } from 'framer-motion';

const Features = () => {
    return (
        <section id="features" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">Features</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">
                        Why Learn with Bit Buddy?
                    </h2>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Our platform offers a balanced approach to learning both programming and academic subjects through engaging content.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <motion.div
                        className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:border-indigo-100 transition-all duration-300"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                            <span className="text-2xl">😂</span>
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-3 text-slate-900">Balanced Learning</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Equal focus on programming, sciences, mathematics, humanities, and languages through relatable memes.
                        </p>
                    </motion.div>

                    {/* Feature 2 */}
                    <motion.div
                        className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:border-indigo-100 transition-all duration-300"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6 text-violet-600">
                            <span className="text-2xl">🎮</span>
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-3 text-slate-900">Gamified Experience</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Earn XP across all subjects equally, with specialized achievements for diverse learning paths.
                        </p>
                    </motion.div>

                    {/* Feature 3 */}
                    <motion.div
                        className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:border-indigo-100 transition-all duration-300"
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-3 text-slate-900">Personalized Content</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Create custom learning paths that blend programming with academic subjects for a well-rounded education.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Features;
