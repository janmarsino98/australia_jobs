
import { Link } from "react-router-dom";

interface NavTextOptionProps {
  text: string;
  path?: string;
  isActive?: boolean;
  isPrimary?: boolean;
}

const NavTextOption = ({ 
  text, 
  path, 
  isActive = false,
  isPrimary = false 
}: NavTextOptionProps): JSX.Element => {
  if (!path) {
    return (
      <span className="text-sm font-medium text-main-text p-2">
        {text}
      </span>
    );
  }

  const baseClasses = "text-sm font-medium transition-all duration-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pill-text focus:ring-offset-2";
  
  const styleClasses = isPrimary
    ? "bg-pill-text text-white hover:bg-pill-text/90 shadow-sm"
    : `${isActive ? "text-pill-text" : "text-main-text"} hover:text-pill-text hover:bg-pill-bg/50`;

  return (
    <div className="flex relative">
      <Link 
        to={path}
        className={`${baseClasses} ${styleClasses}`}
        role="menuitem"
        aria-current={isActive ? "page" : undefined}
      >
        {text}
      </Link>
      {isActive && !isPrimary && (
        <div 
          className="w-full border border-pill-text absolute -bottom-1 right-1/2 left-1/2 transform -translate-x-1/2 rounded-full" 
          aria-hidden="true" 
        />
      )}
    </div>
  );
};

export default NavTextOption; 