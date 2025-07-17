import { forwardRef } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import { useState } from "react";
import { IconType } from "react-icons";

interface FormInputProps {
  inputType?: string;
  label?: string;
  Icon?: IconType;
  error?: string;
  onChange?: any;
  id?: string;
  isLoading?: boolean;
  [key: string]: any;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({ inputType, label, Icon, error, onChange, id, isLoading, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(
    inputType === "password" ? false : null
  );
  const [isFocused, setIsFocused] = useState(false);

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only unfocus if we're not clicking within the same input container
    const container = e.currentTarget.closest('.input-container');
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (!container?.contains(relatedTarget)) {
      setIsFocused(false);
    }
  };

  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 ml-1">
          {label}
        </label>
      )}
      <div 
        className={`
          input-container relative flex flex-row items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 
          ${error 
            ? 'border-red-300 bg-red-50/50 focus-within:border-red-500 focus-within:bg-red-50/70' 
            : isFocused 
              ? 'border-blue-400 bg-blue-50/50 shadow-md shadow-blue-100/50' 
              : 'border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white/90'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          backdrop-blur-sm
        `}
      >
        {/* Focus ring effect */}
        {isFocused && !error && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
        )}
        
        {Icon && (
          <Icon 
            className={`
              text-lg transition-colors duration-200 relative z-10
              ${error 
                ? 'text-red-500' 
                : isFocused 
                  ? 'text-blue-600' 
                  : 'text-gray-500'
              }
            `} 
            aria-hidden="true" 
          />
        )}
        
        <input
          id={inputId}
          placeholder={label}
          type={inputType === "password" && showPassword ? "text" : inputType}
          className={`
            flex-grow bg-transparent outline-none text-gray-900 placeholder-gray-400 relative z-10
            text-[16px] leading-relaxed
            ${props.className || ''}
          `}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : undefined}
          disabled={isLoading}
          {...props}
        />
        
        {inputType === "password" && (
          <button
            type="button"
            onClick={handlePasswordVisibility}
            className={`
              p-2 rounded-md transition-all duration-200 relative z-10
              ${isFocused 
                ? 'text-blue-600 hover:bg-blue-100/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1
            `}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={isLoading}
          >
            {showPassword ? <FaRegEyeSlash aria-hidden="true" /> : <FaRegEye aria-hidden="true" />}
          </button>
        )}
        
        {isLoading && (
          <CgSpinner className="animate-spin text-blue-500 text-xl relative z-10" aria-hidden="true" />
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500 ml-1 flex items-center gap-1" role="alert">
          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = "FormInput";

export default FormInput;
