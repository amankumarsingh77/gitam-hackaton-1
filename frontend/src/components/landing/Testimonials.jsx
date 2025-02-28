import { FiStar } from 'react-icons/fi';

const Testimonials = () => {
    return (
        <section className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">Testimonials</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">
                        What Our Users Say
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Testimonial 1 */}
                    <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-md">
                                JD
                            </div>
                            <div>
                                <h4 className="font-heading font-bold text-slate-900">John Doe</h4>
                                <p className="text-sm text-slate-500">Web Developer</p>
                            </div>
                            <div className="ml-auto flex text-amber-400">
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            "I've tried many coding platforms, but Bit Buddy makes it actually fun! The memes help me remember concepts better than traditional methods."
                        </p>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-md">
                                AS
                            </div>
                            <div>
                                <h4 className="font-heading font-bold text-slate-900">Alice Smith</h4>
                                <p className="text-sm text-slate-500">Computer Science Student</p>
                            </div>
                            <div className="ml-auto flex text-amber-400">
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            "The gamification elements keep me motivated. I've maintained a 30-day streak and learned more than I did in my entire semester!"
                        </p>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-md">
                                RJ
                            </div>
                            <div>
                                <h4 className="font-heading font-bold text-slate-900">Robert Johnson</h4>
                                <p className="text-sm text-slate-500">Self-taught Programmer</p>
                            </div>
                            <div className="ml-auto flex text-amber-400">
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                                <FiStar className="fill-current" />
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            "The AI chapter creator is amazing! I created a custom course on React hooks that was both informative and hilarious."
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
