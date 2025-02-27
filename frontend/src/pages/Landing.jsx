import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import modular components
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import PopularTopics from '../components/landing/PopularTopics';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';
import Stats from '../components/landing/Stats';

function Landing() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800">
            {/* Header/Navigation */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-5">
                        <div className="flex items-center">
                            <span className="font-heading font-bold text-2xl bg-gradient-to-r from-indigo-600 to-violet-500 text-transparent bg-clip-text">
                                MemeLearn
                            </span>
                        </div>
                        <div className="flex items-center space-x-6">
                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-5 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-slate-700 font-medium hover:text-indigo-600 transition-colors">
                                        Log in
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-5 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <Hero />

            {/* Features Section */}
            <Features />

            {/* How It Works Section */}
            <HowItWorks />

            {/* Popular Topics Section */}
            <PopularTopics />

            {/* Testimonials Section */}
            <Testimonials />

            {/* Stats Section */}
            <Stats />

            {/* Call to Action Section */}
            <CallToAction />

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-white font-medium mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-4">Resources</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-4">Connect</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-slate-800 text-center">
                        <p>&copy; {new Date().getFullYear()} MemeLearn. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing; 