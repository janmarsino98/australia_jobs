import PropTypes from "prop-types";

const NavIconImg = ({ img_url }) => {
  return (
    <div className="h-full w-max justify-center p-0 m-0">
      <img className="h-[60px] w-max" src={img_url} alt="firm-icon" />
    </div>
  );
};

NavIconImg.propTypes = {
  img_url: PropTypes.string.isRequired,
};

export default NavIconImg;
