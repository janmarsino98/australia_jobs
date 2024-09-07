import { useEffect, useState } from "react";
import LocationIcon from "../atoms/LocationIcon";
import { Dropdown } from "primereact/dropdown";
import httpClient from "../../httpClient";

const LocationDisplayer = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [states, setStates] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await httpClient.get(
          "http://localhost:5000/cities/get_all"
        );
        const new_cities = response.data
          .filter((city) => city.state == selectedState)
          .map((city) => city.city);
        setCities(new_cities);
      } catch (error) {
        console.error("Error fetching cities: ", error);
      }
    };

    fetchCities();
  }, [selectedState]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await httpClient.get(
          "http://localhost:5000/states/get_all"
        );
        const new_states = response.data.map((state) => state.state);
        setStates(new_states);
      } catch (error) {
        console.error("Error while fetching states: ", error);
      }
    };
    fetchStates();
  }, []);
  return (
    <div className="flex flex-row py-[12px]">
      <div className="w-[48px] h-[48px] mr-[16px]">
        <LocationIcon />
      </div>
      <div className="flex flex-col gap-2">
        <Dropdown
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.value)}
          options={cities}
          placeholder="Select a City"
          className="w-full md:w-14rem"
        />
        <Dropdown
          value={selectedState}
          onChange={(e) => setSelectedState(e.value)}
          options={states}
          placeholder="Select a State"
          className="w-full md:w-14rem"
        />
      </div>
    </div>
  );
};

export default LocationDisplayer;
