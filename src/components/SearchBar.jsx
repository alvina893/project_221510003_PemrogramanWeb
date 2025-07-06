import React from "react";

export const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search">
      <div>
        <img src="./public/icons/search.svg" alt="searchIcon" />
        <input
          type="text"
          placeholder="Search for your saved crochet patterns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};
