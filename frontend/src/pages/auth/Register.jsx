import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerUser, clearError } from '../../store/slices/authSlice';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        grade: 10,
    });
    const [formErrors, setFormErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }

        // Clear any previous errors when component mounts
        dispatch(clearError());
    }, [isAuthenticated, navigate, dispatch]);

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

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

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.grade) {
            errors.grade = 'Grade is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'grade' ? parseInt(value, 10) : value,
        });

        // Clear error for this field when user types
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: '',
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                // Remove confirmPassword before sending to API
                const { confirmPassword, ...userData } = formData;
                await dispatch(registerUser(userData)).unwrap();

                // Show success message
                setSuccessMessage('Registration successful! Redirecting to login...');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } catch (err) {
                // Error is handled by the Redux slice
            }
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
                            Join MemeLearn
                        </h2>
                        <p className="mt-2 text-center text-sm text-white text-opacity-90">
                            Start your fun learning journey today!
                        </p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg" role="alert">
                                <span className="block sm:inline">{successMessage}</span>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg bg-slate-100 border ${formErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'} focus:ring-2 focus:ring-opacity-50 outline-none transition-all`}
                                    placeholder="John Doe"
                                />
                                {formErrors.name && (
                                    <p className="mt-1.5 text-sm text-red-500">{formErrors.name}</p>
                                )}
                            </div>

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
                                <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-2">
                                    Grade Level
                                </label>
                                <select
                                    id="grade"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg text-slate-700 bg-slate-100 border ${formErrors.grade ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'} focus:ring-2 focus:ring-opacity-50 outline-none transition-all appearance-none bg-no-repeat bg-right pr-10`}
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundSize: "1.5em 1.5em" }}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            Grade {i + 1}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.grade && (
                                    <p className="mt-1.5 text-sm text-red-500">{formErrors.grade}</p>
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
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg bg-slate-100 border ${formErrors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'} focus:ring-2 focus:ring-opacity-50 outline-none transition-all`}
                                    placeholder="••••••••"
                                />
                                {formErrors.password && (
                                    <p className="mt-1.5 text-sm text-red-500">{formErrors.password}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg bg-slate-100 border ${formErrors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'} focus:ring-2 focus:ring-opacity-50 outline-none transition-all`}
                                    placeholder="••••••••"
                                />
                                {formErrors.confirmPassword && (
                                    <p className="mt-1.5 text-sm text-red-500">{formErrors.confirmPassword}</p>
                                )}
                            </div>

                            <div className="pt-2">
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
                                            Creating account...
                                        </span>
                                    ) : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Sign in
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

export default Register; 