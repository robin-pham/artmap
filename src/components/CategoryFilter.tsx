import { useState, useEffect, useRef } from "react";
import { ArtworkCategory, ArtworkCategories } from "../types/categories";

interface CategoryFilterProps {
  onCategoryChange: (categories: ArtworkCategory[]) => void;
  selectedCategories: ArtworkCategory[];
  filteredCount: number;
  totalCount: number;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

export function CategoryFilter({
  onCategoryChange,
  selectedCategories,
  filteredCount,
  totalCount,
  isExpanded,
  onExpandChange,
}: CategoryFilterProps) {
  const filterRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (category: ArtworkCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newCategories);
  };

  return (
    <div
      ref={filterRef}
      className={`category-filter ${isExpanded ? "expanded" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="filter-toggle"
        onClick={() => onExpandChange(!isExpanded)}
      >
        <span>Filter</span>
        <span className="filter-count">
          {selectedCategories.length > 0
            ? `${filteredCount} of ${totalCount}`
            : `${totalCount} total`}
        </span>
      </button>

      <div className="filter-content">
        {ArtworkCategories.map((category) => (
          <label key={category} className="category-item">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => toggleCategory(category)}
            />
            <span className="category-label">{category}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
