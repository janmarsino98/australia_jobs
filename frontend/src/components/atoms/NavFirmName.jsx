import PropTypes from "prop-types";

const NavFirmName = ({ name }) => {
  return <div className="font-bold text-[18px]">{name}</div>;
};

NavFirmName.propTypes = {
  name: PropTypes.string.isRequired,
};

export default NavFirmName;
