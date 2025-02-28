import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { updateUserProfile, updateUserAvatar, fetchUserProfile } from '../store/slices/authSlice';
import { fetchUserProgress, fetchUserStreak } from '../store/slices/userSlice';

function Profile() {
    const location = useLocation();
    const dispatch = useDispatch();
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);
    const { xp, level, streak, completedLessons, completedQuizzes, isLoading: userLoading } = useSelector((state) => state.user);

    // Form state for profile settings
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        grade: 10,
        avatar_url: '',
    });

    // Get tab from URL query parameter
    const [activeTab, setActiveTab] = useState('profile');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['profile', 'achievements', 'settings'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [location]);

    // Fetch user data when component mounts
    useEffect(() => {
        if (user?.id) {
            // Fetch user profile
            dispatch(fetchUserProfile(user.id));

            // Fetch user progress and streak
            dispatch(fetchUserProgress({
                userId: user.id,
                subject: 'math', // Default subject
                grade: user.grade || 10
            }));
            dispatch(fetchUserStreak(user.id));
        }
    }, [dispatch, user?.id]);

    // Update form data when user data changes
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.name || '',
                email: user.email || '',
                grade: user.grade || 10,
                avatar_url: user.avatar_url || '',
            });
        }
    }, [user]);

    // Calculate total completed items
    const totalCompleted = completedLessons.length + completedQuizzes.length;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: name === 'grade' ? parseInt(value, 10) : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            if (user?.id) {
                // Update profile
                await dispatch(updateUserProfile({
                    userId: user.id,
                    profileData
                })).unwrap();

                // If avatar URL changed, update avatar
                if (profileData.avatar_url !== user.avatar_url) {
                    await dispatch(updateUserAvatar({
                        userId: user.id,
                        avatarUrl: profileData.avatar_url
                    })).unwrap();
                }

                setSuccessMessage('Profile updated successfully!');
            }
        } catch (error) {
            setErrorMessage(typeof error === 'object' ? (error.message || JSON.stringify(error)) : error || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = () => {
        if (profileData.name) {
            const names = profileData.name.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            }
            return profileData.name[0].toUpperCase();
        }
        return 'U';
    };

    const isLoading = authLoading || userLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-blue-50 -mx-4 px-4 py-6 mb-8">
                <h1 className="text-3xl font-heading font-bold text-textDark">Your Profile</h1>
            </div>

            {/* Tabs */}
            <div className="mb-8">
                <nav className="flex bg-gray-900 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`py-2.5 px-6 rounded-md font-medium text-sm transition-colors ${activeTab === 'profile'
                            ? 'bg-primary text-white'
                            : 'text-white hover:bg-gray-800'
                            }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`py-2.5 px-6 rounded-md font-medium text-sm transition-colors ${activeTab === 'achievements'
                            ? 'bg-primary text-white'
                            : 'text-white hover:bg-gray-800'
                            }`}
                    >
                        Achievements
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-2.5 px-6 rounded-md font-medium text-sm transition-colors ${activeTab === 'settings'
                            ? 'bg-primary text-white'
                            : 'text-white hover:bg-gray-800'
                            }`}
                    >
                        Settings
                    </button>
                </nav>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                            <div className="w-28 h-28 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold">
                                {getInitials()}
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl font-heading font-bold text-textDark">{profileData.name || 'User'}</h2>
                                <p className="text-textMedium">{profileData.email || 'user@example.com'}</p>
                                <div className="mt-3 flex items-center justify-center sm:justify-start">
                                    <span className="bg-primary text-white text-sm px-3 py-1 rounded-full font-medium">Level {level}</span>
                                    <span className="ml-2 text-sm text-textMedium">{xp} XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-heading font-bold text-lg mb-3 text-textDark">Current Streak</h3>
                            <div className="flex items-center">
                                <span className="text-3xl mr-2">🔥</span>
                                <span className="text-3xl font-bold text-textDark">{streak}</span>
                                <span className="ml-2 text-textMedium">days</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-heading font-bold text-lg mb-3 text-textDark">Completed</h3>
                            <div className="text-3xl font-bold text-textDark">{totalCompleted}</div>
                            <div className="text-sm text-textMedium">lessons & quizzes</div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-heading font-bold text-lg mb-3 text-textDark">Next Level</h3>
                            <div className="mb-2">
                                <span className="text-sm text-textMedium">
                                    {xp % 100} / 100 XP
                                </span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${xp % 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm p-8"
                >
                    <h2 className="text-xl font-heading font-bold mb-6 text-textDark">Your Achievements</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Achievement 1 */}
                        <div className={`p-6 rounded-xl ${streak >= 7 ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 opacity-60'}`}>
                            <div className="text-4xl mb-3">🔥</div>
                            <h3 className="font-heading font-bold text-textDark">7-Day Streak</h3>
                            <p className="text-sm text-textMedium mt-1">Learn for 7 days in a row</p>
                        </div>

                        {/* Achievement 2 */}
                        <div className={`p-6 rounded-xl ${level >= 5 ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 opacity-60'}`}>
                            <div className="text-4xl mb-3">⭐</div>
                            <h3 className="font-heading font-bold text-textDark">Level 5</h3>
                            <p className="text-sm text-textMedium mt-1">Reach level 5</p>
                        </div>

                        {/* Achievement 3 */}
                        <div className={`p-6 rounded-xl ${completedQuizzes.length >= 5 ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 opacity-60'}`}>
                            <div className="text-4xl mb-3">🧠</div>
                            <h3 className="font-heading font-bold text-textDark">Quiz Master</h3>
                            <p className="text-sm text-textMedium mt-1">Complete 5 quizzes</p>
                        </div>

                        {/* Achievement 4 */}
                        <div className={`p-6 rounded-xl ${completedLessons.length >= 10 ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50 opacity-60'}`}>
                            <div className="text-4xl mb-3">📚</div>
                            <h3 className="font-heading font-bold text-textDark">Lesson Pro</h3>
                            <p className="text-sm text-textMedium mt-1">Complete 10 lessons</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm p-8"
                >
                    <h2 className="text-xl font-heading font-bold mb-6 text-textDark">Account Settings</h2>

                    {successMessage && (
                        <div className="mb-6 bg-success/10 border border-success text-success px-4 py-3 rounded-lg">
                            {typeof successMessage === 'object' ? JSON.stringify(successMessage) : successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-6 bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
                            {typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-textDark mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={profileData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-textDark mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={profileData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="grade" className="block text-sm font-medium text-textDark mb-1.5">
                                Grade Level
                            </label>
                            <select
                                id="grade"
                                name="grade"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={profileData.grade}
                                onChange={handleInputChange}
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Grade {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="avatar_url" className="block text-sm font-medium text-textDark mb-1.5">
                                Avatar URL
                            </label>
                            <input
                                id="avatar_url"
                                name="avatar_url"
                                type="text"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={profileData.avatar_url}
                                onChange={handleInputChange}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>

                        <div className="pt-2">
                            <h3 className="text-lg font-heading font-bold mb-4 text-textDark">Notification Preferences</h3>

                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <input
                                        id="email-notifications"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        defaultChecked
                                    />
                                    <label htmlFor="email-notifications" className="ml-2 block text-sm text-textDark">
                                        Email notifications
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="streak-reminders"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        defaultChecked
                                    />
                                    <label htmlFor="streak-reminders" className="ml-2 block text-sm text-textDark">
                                        Daily streak reminders
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="marketing"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="marketing" className="ml-2 block text-sm text-textDark">
                                        Marketing emails
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className={`bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-5 rounded-lg transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </div>
    );
}

export default Profile;