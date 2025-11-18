// src/components/shared/PageHeader.jsx
import { PlusIcon } from '@heroicons/react/24/outline';

const PageHeader = ({ 
  title, 
  description, 
  buttonText, 
  onButtonClick,
  showButton = true,
  icon: Icon
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-gray-400 mt-1">{description}</p>
      </div>
      {showButton && (
        <button
          onClick={onButtonClick}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
        >
          {Icon ? <Icon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
