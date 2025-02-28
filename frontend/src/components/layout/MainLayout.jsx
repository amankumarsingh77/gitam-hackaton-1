import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Chatbot from '../common/Chatbot';
import { logoutUser } from '../../store/slices/authSlice';

function MainLayout() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { level, xp, streak } = useSelector(state => state.user);
    const { user } = useSelector(state => state.auth);
    const location = useLocation();

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (user && user.name) {
            const names = user.name.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            }
            return user.name[0].toUpperCase();
        }
        return 'U';
    };

    // Navigation items
    const navItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/achievements', label: 'Achievements' },
        { path: '/leaderboard', label: 'Leaderboard' }
    ];

    // Calculate XP percentage for progress bar
    const xpPercentage = (xp % 100);
    const nextLevel = level + 1;

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="bg-card shadow-card sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link
                                to="/dashboard"
                                className="flex-shrink-0 flex items-center"
                            >
                                <span className="font-heading font-bold text-2xl bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
                                    Bit Buddy
                                </span>
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex space-x-1">
                                {navItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-textMedium hover:text-textDark hover:bg-gray-100'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* XP Counter */}
                            <div className="hidden sm:flex items-center bg-background rounded-lg px-3 py-1.5 shadow-sm border border-border">
                                <div className="rounded-full bg-gradient-to-r from-primary to-highlight text-white font-bold w-8 h-8 flex items-center justify-center mr-2 shadow-sm">
                                    {level}
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium text-textDark flex items-center">
                                        <span>{xp} XP</span>
                                        <span className="text-textLight text-xs ml-1">/ {nextLevel * 100}</span>
                                    </div>
                                    <div className="h-2 w-24 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-2 bg-gradient-to-r from-primary to-highlight rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${xpPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Streak Counter */}
                            <div className="flex items-center bg-background rounded-lg px-3 py-1.5 shadow-sm border border-border">
                                <span className="text-xl mr-1">🔥</span>
                                <span className="font-bold text-textDark">{streak}</span>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-highlight flex items-center justify-center text-white cursor-pointer focus:outline-none shadow-sm border-2 border-white"
                                    aria-expanded={isProfileOpen}
                                    aria-haspopup="true"
                                >
                                    {getInitials()}
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg py-2 z-10 border border-border"
                                        >
                                            <div className="px-4 py-2 border-b border-border">
                                                <p className="text-sm font-medium text-textDark">{user?.name || 'User'}</p>
                                                <p className="text-xs text-textLight truncate">{user?.email || 'user@example.com'}</p>
                                            </div>

                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-textMedium hover:bg-background hover:text-textDark transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Your Profile
                                            </Link>
                                            <Link
                                                to="/profile?tab=settings"
                                                className="block px-4 py-2 text-sm text-textMedium hover:bg-background hover:text-textDark transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-error hover:bg-opacity-10 transition-colors"
                                            >
                                                Sign out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="py-6">
                <Outlet />
            </main>

            {/* Chatbot */}
            <motion.div
                className="fixed bottom-6 right-6 z-50"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {isChatOpen ? (
                    <Chatbot onClose={() => setIsChatOpen(false)} />
                ) : (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-gradient-to-r from-primary to-highlight hover:opacity-90 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        <span className="text-xl">💬</span>
                    </button>
                )}
            </motion.div>
        </div>
    );
}

export default MainLayout; 