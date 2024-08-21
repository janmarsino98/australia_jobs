import React from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useState } from "react";

const FormInput = ({ inputType, label, Icon, onChange }) => {
  const [showPassword, setShowPassword] = useState(
    inputType == "password" ? false : null
  );

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col p-3 rounded-lg border-dark-white border gap-1">
      <label>{label}</label>
      <div className="flex flex-row items-center gap-2">
        {Icon && <Icon />} {/* Render the passed icon */}
        <input
          placeholder={label}
          type={inputType === "password" && showPassword ? "text" : inputType}
          className="outline-none flex-grow"
          onChange={onChange}
        />
        {inputType === "password" && (
          <button
            type="button"
            onClick={handlePasswordVisibility}
            className="focus:outline-none"
          >
            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormInput;
