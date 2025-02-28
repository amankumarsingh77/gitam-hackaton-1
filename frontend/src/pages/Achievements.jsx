import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { achievementsAPI } from '../services/api';
import { mapAchievementData } from '../utils/achievementUtils';
import AchievementCard from '../components/AchievementCard';
import { toast } from 'react-toastify';

function Achievements() {
    const { user } = useSelector(state => state.auth);
    const { level, xp } = useSelector(state => state.user);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                setLoading(true);
                let achievementsData;

                // If user is logged in, fetch their achievements
                if (user && user.token) {
                    const response = await achievementsAPI.getUserAchievements();
                    achievementsData = response.data;
                } else {
                    // Otherwise fetch all public achievements
                    const response = await achievementsAPI.getAllAchievements();
                    achievementsData = response.data;
                }

                // Map API data to component format
                const mappedAchievements = achievementsData.map(achievement =>
                    mapAchievementData(achievement)
                );

                setAchievements(mappedAchievements);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching achievements:', err);
                setError('Failed to load achievements. Please try again later.');
                setLoading(false);
                toast.error('Failed to load achievements');
            }
        };

        fetchAchievements();
    }, [user]);

    // Calculate achievement progress
    const achievementProgress = achievements.length > 0
        ? Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header with improved styling */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 -mx-4 px-6 py-10 mb-10 rounded-b-3xl shadow-lg">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-heading font-bold text-white">Your Achievements</h1>
                    <p className="text-indigo-100 mt-2 text-lg">Track your learning milestones and accomplishments</p>
                </motion.div>
            </div>

            {/* Achievement Progress */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-6 mb-10 border border-indigo-100"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="w-full md:w-2/3">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-heading font-bold text-gray-800 text-lg">Achievement Progress</h3>
                            <span className="text-indigo-600 font-bold">{achievementProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-4 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${achievementProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-gray-500 text-sm">
                            You've unlocked {achievements.filter(a => a.unlocked).length} of {achievements.length} achievements
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg">
                                {level || 1}
                            </div>
                            <p className="mt-2 font-medium text-gray-700">Level</p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex flex-col items-center justify-center text-white mx-auto shadow-lg">
                                <span className="text-xl">✨</span>
                                <span className="font-bold">{xp || 0}</span>
                            </div>
                            <p className="mt-2 font-medium text-gray-700">XP</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-md p-6 border border-emerald-100"
                >
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 p-3 mr-4 shadow-md">
                            <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-gray-800 text-lg">Achievements</h3>
                            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
                                {achievements.filter(a => a.unlocked).length}/{achievements.length}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl shadow-md p-6 border border-violet-100"
                >
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 p-3 mr-4 shadow-md">
                            <span className="text-2xl">⭐</span>
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-gray-800 text-lg">Current Level</h3>
                            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-600">{level || 1}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md p-6 border border-amber-100"
                >
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 p-3 mr-4 shadow-md">
                            <span className="text-2xl">✨</span>
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-gray-800 text-lg">Total XP</h3>
                            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">{xp || 0}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Achievements List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.length > 0 ? (
                    achievements.map((achievement, index) => (
                        <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            index={index}
                        />
                    ))
                ) : (
                    <div className="col-span-3 text-center py-10">
                        <div className="text-4xl mb-4">🏆</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Achievements Yet</h3>
                        <p className="text-gray-500">Complete lessons and quizzes to earn achievements!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Achievements; 