// src/components/shared/SearchBar.jsx
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className = "" 
}) => {
  return (
    <div className={`relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl p-4 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-green-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
        />
      </div>
    </div>
  );
};

export default SearchBar;
