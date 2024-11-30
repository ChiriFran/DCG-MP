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

  // Detectar la tecla Enter en el campo de búsqueda
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
      // Filtrar las sugerencias (puedes ajustar esto según la lógica de tu aplicación)
      const filteredSuggestions = ["T-shirt", "Hoodie", "Caps", "Bags"]
        .filter((item) => item.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]); // Vaciar las sugerencias si el input está vacío
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    setShowSuggestions(false); // Cerrar las sugerencias al seleccionar una opción
  };

  const handleInputClick = () => {
    setShowSuggestions(true); // Mostrar las sugerencias al hacer clic en el input

    if (searchTerm.length === 0) {
      // Si el input está vacío, mostrar todas las sugerencias
      setSuggestions(["T-shirt", "Hoodie", "Caps", "Bags"]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false); // Cerrar las sugerencias al hacer clic fuera
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="search-filters">
      <div className="input-container" ref={suggestionsRef}>
        <input
          className="barraBusqueda"
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={handleKeyDown}  // Detecta Enter en el input
          onClick={handleInputClick} // Muestra las sugerencias al hacer clic
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
      <button className="btnBuscar" onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchFilters;
