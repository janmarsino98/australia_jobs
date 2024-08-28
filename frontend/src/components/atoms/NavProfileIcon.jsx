import PropTypes from "prop-types";

const NavProfileIcon = ({ profImg }) => {
  return (
    <div className="w-[40px] h-[40px]">
      <img
        src={profImg}
        alt="profile picture"
        className="rounded-full w-full h-full object-cover"
      />
    </div>
  );
};

NavProfileIcon.propTypes = {
  profImg: PropTypes.string.isRequired,
};

export default NavProfileIcon;
