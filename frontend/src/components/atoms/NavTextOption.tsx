
import { Link } from "react-router-dom";

interface NavTextOptionProps {
  text: string;
  path?: string;
}

const NavTextOption = ({ text, path }: NavTextOptionProps): JSX.Element => {
  if (!path) {
    return (
      <span className="text-main-text text-[14px] font-medium p-2">
        {text}
      </span>
    );
  }

  return (
    <Link 
      to={path}
      className="text-main-text text-[14px] font-medium p-2 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      role="menuitem"
    >
      {text}
    </Link>
  );
};

export default NavTextOption; 