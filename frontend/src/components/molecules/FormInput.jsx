import { forwardRef } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import { useState } from "react";

const FormInput = forwardRef(({ inputType, label, Icon, error, onChange, id, isLoading, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(
    inputType === "password" ? false : null
  );

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex flex-col p-3 rounded-lg border-dark-white border gap-1 ${isLoading ? 'opacity-50' : ''}`}>
        <label htmlFor={inputId} className="text-sm text-gray-700">
          {label}
        </label>
        <div className="flex flex-row items-center gap-2" role="presentation">
          {Icon && (
            <Icon className="text-gray-500" aria-hidden="true" />
          )}
          <input
            id={inputId}
            placeholder={label}
            type={inputType === "password" && showPassword ? "text" : inputType}
            className="outline-none flex-grow text-gray-900"
            onChange={onChange}
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
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? <FaRegEyeSlash aria-hidden="true" /> : <FaRegEye aria-hidden="true" />}
            </button>
          )}
          {isLoading && (
            <CgSpinner className="animate-spin text-gray-500 text-xl" aria-hidden="true" />
          )}
        </div>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = "FormInput";

export default FormInput;
