// src/components/shared/InfoBox.jsx
const InfoBox = ({ children, type = 'info' }) => {
  const types = {
    info: {
      bg: 'from-blue-500/10 to-blue-600/10',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      strongText: 'text-blue-400',
      icon: '📌'
    },
    warning: {
      bg: 'from-yellow-500/10 to-yellow-600/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-300',
      strongText: 'text-yellow-400',
      icon: '⚠️'
    },
    success: {
      bg: 'from-green-500/10 to-green-600/10',
      border: 'border-green-500/30',
      text: 'text-green-300',
      strongText: 'text-green-400',
      icon: '✅'
    }
  };

  const config = types[type] || types.info;

  return (
    <div className={`relative bg-gradient-to-br ${config.bg} backdrop-blur-xl border ${config.border} rounded-xl p-4 overflow-hidden`}>
      <div className="absolute inset-0 bg-blue-500/5"></div>
      <div className={`relative text-sm ${config.text}`}>
        {children}
      </div>
    </div>
  );
};

export default InfoBox;
