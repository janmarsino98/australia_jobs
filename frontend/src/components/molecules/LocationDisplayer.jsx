import React from "react";
import LocationIcon from "../atoms/LocationIcon";

const LocationDisplayer = () => {
  return (
    <div className="flex flex-row py-[12px]">
      <div className="w-[48px] mr-[16px]">
        <LocationIcon />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-[16px]">Sydney, NSW</span>
        <span className="text-[14px] text-searchbar-text">NSW</span>
      </div>
    </div>
  );
};

export default LocationDisplayer;
