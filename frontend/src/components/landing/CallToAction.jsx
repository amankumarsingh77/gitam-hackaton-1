import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const CallToAction = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                        Ready to Start Learning?
                    </h2>
                    <p className="text-xl mb-10 text-indigo-100 leading-relaxed">
                        Join thousands of learners who are mastering programming the fun way.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link
                            to="/register"
                            className="flex items-center justify-center bg-white hover:bg-slate-50 text-indigo-600 font-medium rounded-lg px-8 py-3.5 text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Create Free Account <FiArrowRight className="ml-2" />
                        </Link>
                        <Link
                            to="/login"
                            className="flex items-center justify-center bg-transparent hover:bg-indigo-500 border border-white text-white font-medium rounded-lg px-8 py-3.5 text-lg transition-all duration-200"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
