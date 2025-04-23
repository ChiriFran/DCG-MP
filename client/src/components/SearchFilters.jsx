import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/SearchFilters.css";

const categories = ["T-shirts", "Hoodies", "Caps", "Bags", "Frames"];

const SearchFilters = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const handleSearch = useCallback(() => {
    onSearch({ title: searchTerm.trim(), category });
  }, [searchTerm, category, onSearch]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    setSuggestions(
      value
        ? categories.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase())
        )
        : []
    );
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClickOutside = useCallback((event) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [handleClickOutside]);

  return (
    <form className="search-filters" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
      <div className="input-container" ref={suggestionsRef}>
        <input
          className="barraBusqueda"
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleChange}
          onClick={() => {
            setShowSuggestions(true);
            if (!searchTerm) setSuggestions(categories);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-list-products">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <select
        className="categorySelect"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">See all categories</option>
        {categories.map((cat, i) => (
          <option key={i} value={cat}>{cat}</option>
        ))}
      </select>

      <button className="btnBuscar" type="submit">Search</button>
    </form>
  );
};

export default SearchFilters;
