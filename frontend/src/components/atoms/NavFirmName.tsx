import React from "react";

interface NavFirmNameProps {
  name: string;
}

const NavFirmName = ({ name }: NavFirmNameProps): JSX.Element => {
  return <div className="font-bold text-[18px]">{name}</div>;
};

export default NavFirmName; 