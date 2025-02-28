import { motion } from 'framer-motion';

function AchievementCard({ achievement, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border ${achievement.unlocked ? 'border-indigo-100' : 'border-gray-200'} ${!achievement.unlocked ? 'opacity-70' : ''}`}
        >
            <div className={`p-6 ${achievement.unlocked ? `bg-gradient-to-r ${achievement.color} bg-opacity-10` : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className={`text-4xl p-3 rounded-full ${achievement.unlocked ? `bg-gradient-to-r ${achievement.color}` : 'bg-gray-200'} text-white shadow-md`}>
                        {achievement.iconUrl ? (
                            <img src={achievement.iconUrl} alt={achievement.title} className="w-8 h-8" />
                        ) : (
                            achievement.icon
                        )}
                    </div>
                    {achievement.unlocked ? (
                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                            Unlocked
                        </span>
                    ) : (
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                            Locked
                        </span>
                    )}
                </div>
                <h3 className="font-heading font-bold text-gray-800 text-xl mb-2">{achievement.title}</h3>
                <p className="text-gray-600">{achievement.description}</p>

                {/* Progress indicator for locked achievements */}
                {!achievement.unlocked && achievement.progress > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.currentValue}/{achievement.requiredValue}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className={`bg-gradient-to-r ${achievement.color} h-2 rounded-full`}
                                style={{ width: `${Math.min(100, achievement.progress)}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {achievement.unlocked && achievement.date && (
                    <div className="flex items-center mt-4 text-gray-500 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Achieved on {new Date(achievement.date).toLocaleDateString()}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default AchievementCard; 