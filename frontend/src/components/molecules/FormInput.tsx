import React, { forwardRef, useEffect, useRef } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import { useState } from "react";
import { IconType } from "react-icons";

interface FormInputProps {
  inputType?: string;
  label?: string;
  Icon?: IconType;
  endIcon?: IconType;
  onEndIconClick?: () => void;
  error?: string;
  onChange?: any;
  id?: string;
  isLoading?: boolean;
  value?: string;
  [key: string]: any;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({ inputType, label, Icon, endIcon, onEndIconClick, error, onChange, id, isLoading, value, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(
    inputType === "password" ? false : null
  );
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use document click listener to ensure blur works properly
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        if (isFocused) {
          setIsFocused(false);
        }
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [isFocused, label]);
  
  // Track content state via onChange
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHasContent = e.target.value.length > 0;
    setHasContent(newHasContent);
    
    if (onChange) onChange(e);
  };
  
  // Ultra-conservative styling: only show red for actual errors, only when field has content
  const isInvalid = hasContent && !!error;
  const isValid = false; // Never show green since we can't reliably detect valid content
  

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    // Use setTimeout to ensure blur fires after any click events
    setTimeout(() => {
      setIsFocused(false);
    }, 0);
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
        ref={inputRef}
        className={`
          input-container relative flex flex-row items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 backdrop-blur-sm
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          ${(() => {
            if (isInvalid) return 'claude-invalid !border-red-300 !bg-red-50/50';
            if (isValid) return 'claude-valid !border-green-300 !bg-green-50/50';
            if (isFocused) return 'claude-focused !border-blue-400 !bg-blue-50/50 shadow-md shadow-blue-100/50';
            return 'claude-default !border-gray-200 !bg-white/70 hover:!border-gray-300 hover:!bg-white/90';
          })()}
        `}
      >
        {/* Focus ring effect */}
        {isFocused && !isInvalid && !isValid && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
        )}
        
        {Icon && (
          <Icon 
            className={`
              text-lg transition-colors duration-200 relative z-10
              ${(() => {
                if (isInvalid) return 'text-red-500';
                if (isValid) return 'text-green-600';
                if (isFocused) return 'text-blue-600';
                return 'text-gray-500';
              })()}
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
          onChange={handleInputChange}
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
            tabIndex={-1}
            className={`
              p-2 rounded-md transition-all duration-200 relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1
              ${(() => {
                if (isInvalid) return 'text-red-500 hover:bg-red-100/50';
                if (isValid) return 'text-green-600 hover:bg-green-100/50';
                if (isFocused) return 'text-blue-600 hover:bg-blue-100/50';
                return 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50';
              })()}
            `}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={isLoading}
          >
            {showPassword ? <FaRegEyeSlash aria-hidden="true" /> : <FaRegEye aria-hidden="true" />}
          </button>
        )}
        
        {endIcon && onEndIconClick && (
          <button
            type="button"
            onClick={onEndIconClick}
            tabIndex={-1}
            className={`
              p-2 rounded-md transition-all duration-200 relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1
              ${(() => {
                if (isInvalid) return 'text-red-500 hover:bg-red-100/50';
                if (isValid) return 'text-green-600 hover:bg-green-100/50';
                if (isFocused) return 'text-blue-600 hover:bg-blue-100/50';
                return 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50';
              })()}
            `}
            disabled={isLoading}
          >
            {React.createElement(endIcon, { "aria-hidden": true })}
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
