import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { storeAuthData } from '../../utils/tokenUtils';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const [redirectMessage, setRedirectMessage] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isLoading, error, user, token } = useSelector((state) => state.auth);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user && token) {
            // Store token and user data using our utility function
            storeAuthData(token, user, rememberMe);

            // Redirect to the page they were trying to access, or dashboard
            const from = location.state?.from || '/dashboard';
            navigate(from);
        }

        // Check if redirected with a message
        if (location.state?.message) {
            // Ensure we're getting a string, not an object
            const message = typeof location.state.message === 'object'
                ? location.state.message.message || JSON.stringify(location.state.message)
                : location.state.message;
            setRedirectMessage(message);
        }

        // Clear any previous errors when component mounts
        dispatch(clearError());
    }, [isAuthenticated, user, token, navigate, dispatch, location, rememberMe]);

    const validateForm = () => {
        const errors = {};

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error for this field when user types
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: '',
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            dispatch(loginUser(formData));
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                        <h2 className="text-center text-3xl font-heading font-bold">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-center text-sm text-white text-opacity-90">
                            Sign in to continue your learning journey
                        </p>
                    </div>

                    <div className="p-8">
                        {redirectMessage && (
                            <div className="mb-6 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg" role="alert">
                                <span className="block sm:inline">{redirectMessage}</span>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg bg-slate-100 border ${formErrors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'} focus:ring-2 focus:ring-opacity-50 outline-none transition-all`}
                                    placeholder="you@example.com"
                                />
                                {formErrors.email && (
                                    <p className="mt-1.5 text-sm text-red-500">{formErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg bg-slate-100 border ${formErrors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'} focus:ring-2 focus:ring-opacity-50 outline-none transition-all`}
                                    placeholder="••••••••"
                                />
                                {formErrors.password && (
                                    <p className="mt-1.5 text-sm text-red-500">{formErrors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>

                <div className="mt-10 text-center">
                    <div className="flex items-center justify-center space-x-4">
                        <a href="#" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                            Terms of Service
                        </a>
                        <span className="text-slate-400">•</span>
                        <a href="#" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                            Privacy Policy
                        </a>
                        <span className="text-slate-400">•</span>
                        <a href="#" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;