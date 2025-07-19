
interface NavFirmNameProps {
  name: string;
}

const NavFirmName = ({ name }: NavFirmNameProps): JSX.Element => {
  return (
    <div className="text-xl font-semibold text-main-text transition-colors duration-200 group-hover:text-pill-text">
      {name}
    </div>
  );
};

export default NavFirmName; 