// src/components/shared/BackButton.jsx
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ to, label = "Volver" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-gray-400 hover:text-green-400 mb-4 transition-colors group"
    >
      <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
      {label}
    </button>
  );
};

export default BackButton;
