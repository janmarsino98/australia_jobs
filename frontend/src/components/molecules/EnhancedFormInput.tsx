import React, { forwardRef } from "react";
import { IconType } from "react-icons";
import { AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedFormInputProps {
  inputType?: string;
  label?: string;
  Icon?: IconType;
  endIcon?: IconType;
  onEndIconClick?: () => void;
  error?: string;
  success?: string;
  onChange?: any;
  id?: string;
  isLoading?: boolean;
  value?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  validationRules?: string[];
  showValidation?: boolean;
  [key: string]: any;
}

const EnhancedFormInput = forwardRef<HTMLInputElement, EnhancedFormInputProps>(({
  inputType = "text",
  label,
  Icon,
  endIcon,
  onEndIconClick,
  error,
  success,
  onChange,
  id,
  isLoading,
  value = "",
  placeholder,
  required = false,
  helpText,
  validationRules = [],
  showValidation = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const hasContent = value && value.length > 0;
  const showError = error && hasInteracted;
  const showSuccess = success && hasContent && !error && hasInteracted;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasInteracted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInteracted(true);
    if (onChange) onChange(e);
  };

  const getInputClassNames = () => {
    let baseClasses = "w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none";
    
    if (showError) {
      return `${baseClasses} border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
    }
    
    if (showSuccess) {
      return `${baseClasses} border-green-300 bg-green-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-100`;
    }
    
    if (isFocused) {
      return `${baseClasses} border-blue-400 bg-blue-50/50 focus:ring-2 focus:ring-blue-100`;
    }
    
    return `${baseClasses} border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50`;
  };

  const getIconColor = () => {
    if (showError) return "text-red-500";
    if (showSuccess) return "text-green-500";
    if (isFocused) return "text-blue-500";
    return "text-gray-500";
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className={`relative flex items-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {Icon && (
            <div className={`absolute left-3 z-10 ${getIconColor()} transition-colors duration-200`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${getInputClassNames()} ${Icon ? 'pl-12' : ''} ${endIcon || showError || showSuccess ? 'pr-12' : ''}`}
            disabled={isLoading}
            aria-invalid={showError ? "true" : "false"}
            aria-describedby={
              showError ? `${inputId}-error` : 
              helpText ? `${inputId}-help` : 
              undefined
            }
            {...props}
          />
          
          <div className="absolute right-3 z-10 flex items-center space-x-2">
            {showError && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <AlertCircle className="h-5 w-5 text-red-500" />
              </motion.div>
            )}
            
            {showSuccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
              </motion.div>
            )}
            
            {endIcon && onEndIconClick && (
              <button
                type="button"
                onClick={onEndIconClick}
                className={`p-1 rounded-md transition-colors ${getIconColor()} hover:bg-gray-100`}
                disabled={isLoading}
              >
                {React.createElement(endIcon, { className: "h-5 w-5" })}
              </button>
            )}
            
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            id={`${inputId}-error`}
            className="flex items-start space-x-2 text-sm text-red-600"
            role="alert"
          >
            <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start space-x-2 text-sm text-green-600"
          >
            <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
        
        {helpText && !showError && !showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id={`${inputId}-help`}
            className="text-sm text-gray-500"
          >
            {helpText}
          </motion.div>
        )}
      </AnimatePresence>

      {showValidation && validationRules.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-gray-600 mb-1">Requirements:</p>
          {validationRules.map((rule, index) => {
            const isValid = !error || !error.includes(rule.toLowerCase());
            return (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
                  {rule}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

EnhancedFormInput.displayName = "EnhancedFormInput";

export default EnhancedFormInput;