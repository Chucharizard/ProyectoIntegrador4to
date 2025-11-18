// src/components/shared/StatsCard.jsx
const StatsCard = ({ label, value, icon: Icon, color = 'green' }) => {
  const colorClasses = {
    green: {
      border: 'border-green-500/20 hover:border-green-500/40',
      bg: 'from-green-500/5',
      shadow: 'hover:shadow-green-500/10',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'from-blue-500/5',
      shadow: 'hover:shadow-blue-500/10',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bg: 'from-purple-500/5',
      shadow: 'hover:shadow-purple-500/10',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      bg: 'from-red-500/5',
      shadow: 'hover:shadow-red-500/10',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400'
    }
  };

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <div className={`group relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl p-6 rounded-xl border ${colors.border} transition-all duration-300 hover:shadow-lg ${colors.shadow}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`${colors.iconBg} p-3 rounded-lg`}>
            <Icon className={`h-8 w-8 ${colors.iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
