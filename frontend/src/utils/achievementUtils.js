// Map achievement types to icons and colors
export const getAchievementIcon = (type) => {
  switch (type) {
    case 'lessons_completed':
      return '🏆';
    case 'streak':
      return '🔥';
    case 'quiz_score':
      return '🧠';
    case 'subject_mastery':
      return '🎓';
    case 'xp_earned':
      return '✨';
    case 'custom':
      return '🌟';
    default:
      return '🏅';
  }
};

export const getAchievementColor = (type) => {
  switch (type) {
    case 'lessons_completed':
      return 'from-emerald-400 to-teal-500';
    case 'streak':
      return 'from-amber-400 to-orange-500';
    case 'quiz_score':
      return 'from-purple-400 to-violet-500';
    case 'subject_mastery':
      return 'from-rose-400 to-pink-500';
    case 'xp_earned':
      return 'from-blue-400 to-indigo-500';
    case 'custom':
      return 'from-cyan-400 to-sky-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

// Format achievement date
export const formatAchievementDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString();
};

// Map API achievement data to component format
export const mapAchievementData = (achievement) => {
  return {
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon_url ? null : getAchievementIcon(achievement.type),
    iconUrl: achievement.icon_url || null,
    unlocked: achievement.unlocked || false,
    date: achievement.unlocked_at || null,
    color: getAchievementColor(achievement.type),
    type: achievement.type,
    requiredValue: achievement.required_value,
    currentValue: achievement.current_value || 0,
    progress: achievement.progress || 0
  };
}; 