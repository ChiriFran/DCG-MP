import { useState, useEffect, useRef } from "react";
import '../styles/SearchFilters.css';

const SearchFilters = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const handleSearch = () => {
    onSearch({ title: searchTerm, category: category.toLowerCase() });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Previene la recarga de la página
    handleSearch(); // Llama a la función de búsqueda
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
      const filteredSuggestions = ["T-shirt", "Hoodie", "Caps", "Bags"]
        .filter((item) => item.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputClick = () => {
    setShowSuggestions(true);

    if (searchTerm.length === 0) {
      setSuggestions(["T-shirt", "Hoodie", "Caps", "Bags"]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <form className="search-filters" onSubmit={handleSubmit}>
      <div className="input-container" ref={suggestionsRef}>
        <input
          className="barraBusqueda"
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
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
        <option value="Remeras">T-shirts</option>
        <option value="Buzos">Hoodie</option>
        <option value="Gorras">Caps</option>
        <option value="Bolsas">Bags</option>
      </select>
      <button className="btnBuscar" type="submit">Search</button>
    </form>
  );
};

export default SearchFilters;
