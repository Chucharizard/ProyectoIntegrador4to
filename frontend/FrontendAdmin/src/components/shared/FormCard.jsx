// src/components/shared/FormCard.jsx
const FormCard = ({ children, className = "" }) => {
  return (
    <div className={`relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl border border-green-500/20 p-6 overflow-hidden ${className}`}>
      {/* Efecto de brillo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
      
      {/* Contenido */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default FormCard;
