
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
      <span className="text-sm font-medium text-main-text px-4 py-2">
        {text}
      </span>
    );
  }

  const baseClasses = "relative text-sm font-medium transition-colors duration-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  
  const styleClasses = isPrimary
    ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
    : `${isActive ? "text-pill-text" : "text-main-text"} hover:text-pill-text`;

  return (
    <Link 
      to={path}
      className={`${baseClasses} ${styleClasses}`}
      role="menuitem"
      aria-current={isActive ? "page" : undefined}
    >
      {text}
      {isActive && !isPrimary && (
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-pill-text rounded-full" 
          aria-hidden="true" 
        />
      )}
    </Link>
  );
};

export default NavTextOption; 