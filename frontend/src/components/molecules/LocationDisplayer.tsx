import React, { useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import httpClient from "@/httpClient";
import LocationIcon from "../atoms/LocationIcon";
import { useZodForm } from "@/hooks/useZodForm";
import { locationSchema } from "@/lib/validations/forms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { City, State } from "@/types";

interface LocationDisplayerProps {
  onLocationChange?: (location: { state: string; city: string }) => void;
}

const LocationDisplayer: React.FC<LocationDisplayerProps> = ({ onLocationChange }) => {
  const {
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useZodForm({
    schema: locationSchema,
    defaultValues: {
      state: "",
      city: "",
    },
  });

  const [cities, setCities] = React.useState<string[]>([]);
  const [states, setStates] = React.useState<string[]>([]);
  const selectedState = watch("state");
  const selectedCity = watch("city");

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await httpClient.get<City[]>(
          "http://localhost:5000/cities/get_all"
        );
        const new_cities = response.data
          .filter((city) => city.state === selectedState)
          .map((city) => city.city);
        setCities(new_cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
        setError("root", { message: "Failed to fetch cities" });
      }
    };

    if (selectedState) {
      fetchCities();
      setValue("city", ""); // Reset city when state changes
    }
  }, [selectedState, setValue, setError]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await httpClient.get<State[]>(
          "http://localhost:5000/states/get_all"
        );
        const new_states = response.data.map((state) => state.state);
        setStates(new_states);
      } catch (error) {
        console.error("Error while fetching states:", error);
        setError("root", { message: "Failed to fetch states" });
      }
    };
    fetchStates();
  }, [setError]);

  useEffect(() => {
    if (selectedState && selectedCity && onLocationChange) {
      onLocationChange({ state: selectedState, city: selectedCity });
    }
  }, [selectedState, selectedCity, onLocationChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row py-3">
        <div className="w-12 h-12 mr-4">
          <LocationIcon />
        </div>
        <div className="flex flex-col gap-4 flex-grow">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <Dropdown
            value={selectedState}
            onChange={(e) => setValue("state", e.value)}
            options={states}
            placeholder="Select a State"
            className="w-full"
          />
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}

          <Dropdown
            value={selectedCity}
            onChange={(e) => setValue("city", e.value)}
            options={cities}
            placeholder="Select a City"
            className="w-full"
            disabled={!selectedState}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDisplayer; 