import PropTypes from "prop-types";

const NavTextOption = ({ text, path }) => {
  return (
    <div className=" text-main-text text-[14px] font-medium">
      <a href={path} className="p-2">
        {text}
      </a>
    </div>
  );
};

NavTextOption.propTypes = {
  text: PropTypes.string.isRequired,
  path: PropTypes.string,
};

export default NavTextOption;
