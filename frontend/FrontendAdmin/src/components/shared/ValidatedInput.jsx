/**
 * Input validado con contador de caracteres y mensajes de error
 */
const ValidatedInput = ({
  label,
  name,
  value,
  onChange,
  error,
  maxLength,
  required = false,
  type = 'text',
  placeholder,
  disabled = false,
  icon: Icon,
  helperText,
  ...props
}) => {
  const showCounter = maxLength && value && !error;
  const showError = error;
  const showHelper = helperText && !error && !showCounter;

  return (
    <div>
      <label className="block text-sm font-medium text-green-400 mb-2">
        {Icon && (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>
              {label} {required && <span className="text-red-400">*</span>}
            </span>
          </div>
        )}
        {!Icon && (
          <>
            {label} {required && <span className="text-red-400">*</span>}
          </>
        )}
      </label>
      
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
          error ? 'border-red-500' : 'border-gray-700'
        } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        placeholder={placeholder}
        {...props}
      />
      
      {showError && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {showCounter && (
        <p className="text-xs text-gray-500 mt-1">
          {value.length}/{maxLength} caracteres
        </p>
      )}
      
      {showHelper && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default ValidatedInput;
