import { motion } from 'framer-motion';

const HowItWorks = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">How It Works</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">
                        Learning Made Simple
                    </h2>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Our platform makes learning programming concepts easy and fun with just a few simple steps.
                    </p>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    {/* Step 1 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl p-6 shadow-md border border-slate-100 text-center relative"
                    >
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                            1
                        </div>
                        <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">Sign Up</h3>
                        <p className="text-slate-600">
                            Create your free account in seconds and join our learning community.
                        </p>
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-indigo-100 rounded-full border-4 border-white"></div>
                    </motion.div>

                    {/* Step 2 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl p-6 shadow-md border border-slate-100 text-center relative"
                    >
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                            2
                        </div>
                        <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">Choose Topics</h3>
                        <p className="text-slate-600">
                            Select from our library of programming topics or create your own.
                        </p>
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-indigo-100 rounded-full border-4 border-white"></div>
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl p-6 shadow-md border border-slate-100 text-center relative"
                    >
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                            3
                        </div>
                        <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">Learn with Memes</h3>
                        <p className="text-slate-600">
                            Enjoy our meme-based lessons that make complex concepts stick.
                        </p>
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-indigo-100 rounded-full border-4 border-white"></div>
                    </motion.div>

                    {/* Step 4 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl p-6 shadow-md border border-slate-100 text-center relative"
                    >
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                            4
                        </div>
                        <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">Track Progress</h3>
                        <p className="text-slate-600">
                            Earn XP, complete quizzes, and watch your skills grow over time.
                        </p>
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-indigo-100 rounded-full border-4 border-white"></div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
