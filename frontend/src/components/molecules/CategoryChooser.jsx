import httpClient from "../../httpClient";
import Category_Pill from "../atoms/Category_Pill";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";

const CategoryChooser = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let response = await httpClient.get(
          "http://localhost:5000/jobtypes/get_all"
        );

        const newCategories = response.data.map((item) => item.jobtype);
        setCategories(newCategories);
        setSelectedCategories(newCategories); // Initially select all categories
      } catch (error) {
        console.error("Error while fetching categories: ", error);
      }
    };
    fetchCategories();
  }, []);

  const handlePillClick = (value) => {
    // Remove the category from the available list
    const updatedCategories = selectedCategories.filter(
      (category) => category !== value
    );

    // Add the selected category to the selectedCategories list

    setSelectedCategories(updatedCategories);

    // Notify parent component
    onCategoryChange(updatedCategories);

    console.log("Selected categories: ", updatedCategories);
  };

  return (
    <div className="flex flex-row gap-4 items-center">
      <h3>Select Categories:</h3>
      {selectedCategories.map((category, index) => (
        <Category_Pill
          key={index}
          name={category}
          value={category}
          handleClick={() => handlePillClick(category)}
        />
      ))}
      <Category_Pill name={"+"} value={"+"} />
    </div>
  );
};

CategoryChooser.propTypes = {
  onCategoryChange: PropTypes.func.isRequired,
};

export default CategoryChooser;
