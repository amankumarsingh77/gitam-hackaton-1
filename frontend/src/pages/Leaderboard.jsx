import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

function Leaderboard() {
    const { user } = useSelector(state => state.auth);

    // Mock leaderboard data - in a real app, this would come from an API
    const [leaderboardData, setLeaderboardData] = useState([
        {
            id: 1,
            name: 'Alex Johnson',
            avatar: null,
            xp: 8750,
            level: 12,
            streak: 45,
            rank: 1
        },
        {
            id: 2,
            name: 'Maria Garcia',
            avatar: null,
            xp: 7890,
            level: 11,
            streak: 32,
            rank: 2
        },
        {
            id: 3,
            name: 'James Wilson',
            avatar: null,
            xp: 7200,
            level: 10,
            streak: 28,
            rank: 3
        },
        {
            id: 4,
            name: 'Sarah Lee',
            avatar: null,
            xp: 6500,
            level: 9,
            streak: 21,
            rank: 4
        },
        {
            id: 5,
            name: 'David Kim',
            avatar: null,
            xp: 5800,
            level: 8,
            streak: 19,
            rank: 5
        },
        {
            id: 6,
            name: 'Emma Davis',
            avatar: null,
            xp: 5200,
            level: 7,
            streak: 14,
            rank: 6
        },
        {
            id: 7,
            name: 'Michael Brown',
            avatar: null,
            xp: 4800,
            level: 7,
            streak: 12,
            rank: 7
        },
        {
            id: 8,
            name: 'Sophia Martinez',
            avatar: null,
            xp: 4200,
            level: 6,
            streak: 10,
            rank: 8
        },
        {
            id: 9,
            name: 'Daniel Taylor',
            avatar: null,
            xp: 3800,
            level: 6,
            streak: 8,
            rank: 9
        },
        {
            id: 10,
            name: 'Olivia Anderson',
            avatar: null,
            xp: 3500,
            level: 5,
            streak: 7,
            rank: 10
        }
    ]);

    // Add current user to leaderboard for demo purposes
    useEffect(() => {
        if (user) {
            // Check if user is already in the leaderboard
            const userInLeaderboard = leaderboardData.find(item => item.id === user.id);

            if (!userInLeaderboard) {
                // Add user with random stats for demo
                const userRank = Math.floor(Math.random() * 5) + 3; // Random rank between 3-7
                const userData = {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar_url,
                    xp: 5000 + Math.floor(Math.random() * 2000),
                    level: 7 + Math.floor(Math.random() * 3),
                    streak: 10 + Math.floor(Math.random() * 20),
                    rank: userRank
                };

                // Insert user at their rank
                const newLeaderboard = [...leaderboardData];
                newLeaderboard.splice(userRank - 1, 0, userData);

                // Update ranks
                newLeaderboard.forEach((item, index) => {
                    item.rank = index + 1;
                });

                setLeaderboardData(newLeaderboard.slice(0, 10)); // Keep only top 10
            }
        }
    }, [user]);

    // Get initials for avatar
    const getInitials = (name) => {
        if (name) {
            const names = name.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            }
            return name[0].toUpperCase();
        }
        return 'U';
    };

    // Get gradient colors based on rank
    const getRankGradient = (rank) => {
        if (rank === 1) return 'from-amber-400 to-yellow-300'; // Gold
        if (rank === 2) return 'from-slate-300 to-gray-200'; // Silver
        if (rank === 3) return 'from-amber-700 to-yellow-600'; // Bronze
        return 'from-indigo-100 to-blue-50'; // Others
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header with improved styling */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-4 px-6 py-10 mb-10 rounded-b-3xl shadow-lg">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-heading font-bold text-white">Leaderboard</h1>
                    <p className="text-indigo-100 mt-2 text-lg">See how you rank against other learners</p>
                </motion.div>
            </div>

            {/* Top 3 Podium - New Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row justify-center items-end gap-4 mb-12 px-4"
            >
                {/* 2nd Place */}
                <div className="order-2 md:order-1 flex-1">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            {leaderboardData[1]?.avatar ? (
                                <img src={leaderboardData[1].avatar} alt={leaderboardData[1].name}
                                    className="w-20 h-20 rounded-full border-4 border-slate-300 mb-2" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-slate-400 to-gray-300 flex items-center justify-center text-white text-xl font-bold border-4 border-slate-300 mb-2">
                                    {getInitials(leaderboardData[1]?.name)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-slate-300 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                                2
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="font-bold text-gray-800">{leaderboardData[1]?.name}</p>
                            <p className="text-indigo-600 font-medium">{leaderboardData[1]?.xp.toLocaleString()} XP</p>
                        </div>
                        <div className="h-24 w-full bg-gradient-to-t from-slate-300 to-gray-200 rounded-t-lg mt-3 flex items-end justify-center pb-2">
                            <span className="text-2xl">🥈</span>
                        </div>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 flex-1">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            {leaderboardData[0]?.avatar ? (
                                <img src={leaderboardData[0].avatar} alt={leaderboardData[0].name}
                                    className="w-28 h-28 rounded-full border-4 border-amber-400 mb-2" />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 flex items-center justify-center text-white text-2xl font-bold border-4 border-amber-400 mb-2">
                                    {getInitials(leaderboardData[0]?.name)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md">
                                1
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="font-bold text-gray-800 text-lg">{leaderboardData[0]?.name}</p>
                            <p className="text-indigo-600 font-medium">{leaderboardData[0]?.xp.toLocaleString()} XP</p>
                        </div>
                        <div className="h-32 w-full bg-gradient-to-t from-amber-400 to-yellow-300 rounded-t-lg mt-3 flex items-end justify-center pb-2">
                            <span className="text-3xl">🥇</span>
                        </div>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 flex-1">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            {leaderboardData[2]?.avatar ? (
                                <img src={leaderboardData[2].avatar} alt={leaderboardData[2].name}
                                    className="w-20 h-20 rounded-full border-4 border-amber-700 mb-2" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-700 to-yellow-600 flex items-center justify-center text-white text-xl font-bold border-4 border-amber-700 mb-2">
                                    {getInitials(leaderboardData[2]?.name)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                                3
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="font-bold text-gray-800">{leaderboardData[2]?.name}</p>
                            <p className="text-indigo-600 font-medium">{leaderboardData[2]?.xp.toLocaleString()} XP</p>
                        </div>
                        <div className="h-20 w-full bg-gradient-to-t from-amber-700 to-yellow-600 rounded-t-lg mt-3 flex items-end justify-center pb-2">
                            <span className="text-2xl">🥉</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Leaderboard Table with improved styling */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-100"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                                <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-900">Rank</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-900">User</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-900">Level</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-900">XP</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-indigo-900">Streak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                            {leaderboardData.slice(3).map((item, index) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className={`hover:bg-indigo-50/50 transition-colors ${user && item.id === user.id ? 'bg-indigo-100/50' : ''}`}
                                >
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mr-2 text-indigo-800 font-semibold shadow-sm">
                                                {item.rank}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {item.avatar ? (
                                                <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full mr-3 border-2 border-indigo-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium mr-3 shadow-md">
                                                    {getInitials(item.name)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {item.name}
                                                    {user && item.id === user.id && (
                                                        <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full shadow-sm">You</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-indigo-100 text-indigo-800 rounded-full h-7 w-7 flex items-center justify-center mr-2 font-medium">
                                                {item.level}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-gray-700 font-medium">{item.xp.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center">
                                                <span className="text-xl mr-1">🔥</span>
                                                <span className="font-medium">{item.streak}</span>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

export default Leaderboard; 