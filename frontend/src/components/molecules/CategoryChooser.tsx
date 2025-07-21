import React, { useState, useEffect } from "react";
import httpClient from "../../httpClient";
import Category_Pill from "../atoms/Category_Pill";

interface JobType {
  jobtype: string;
}

interface CategoryChooserProps {
  onCategoryChange: (categories: string[]) => void;
}

const CategoryChooser = ({ onCategoryChange }: CategoryChooserProps): JSX.Element => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await httpClient.get<JobType[]>(
          "/jobtypes/get_all"
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

  const handlePillClick = (value: string): void => {
    // Remove the category from the available list
    const updatedCategories = selectedCategories.filter(
      (category) => category !== value
    );

    // Add the selected category to the selectedCategories list
    setSelectedCategories(updatedCategories);

    // Notify parent component
    onCategoryChange(updatedCategories);
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
      <Category_Pill name="+" value="+" handleClick={() => {}} />
    </div>
  );
};

export default CategoryChooser; 