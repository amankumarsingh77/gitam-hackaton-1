import { motion } from 'framer-motion';

const Stats = () => {
    return (
        <section className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white rounded-xl p-8 shadow-md"
                    >
                        <h3 className="text-4xl font-bold text-indigo-600 mb-2">10k+</h3>
                        <p className="text-slate-600 font-medium">Active Students</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-xl p-8 shadow-md"
                    >
                        <h3 className="text-4xl font-bold text-indigo-600 mb-2">50+</h3>
                        <p className="text-slate-600 font-medium">Learning Topics</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-white rounded-xl p-8 shadow-md"
                    >
                        <h3 className="text-4xl font-bold text-indigo-600 mb-2">500+</h3>
                        <p className="text-slate-600 font-medium">Meme Lessons</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-white rounded-xl p-8 shadow-md"
                    >
                        <h3 className="text-4xl font-bold text-indigo-600 mb-2">95%</h3>
                        <p className="text-slate-600 font-medium">Satisfaction Rate</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Stats;
