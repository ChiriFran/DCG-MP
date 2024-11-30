import { useState, useEffect, useRef } from "react";
import '../styles/MusicFilters.css';

const MusicFilters = ({ onSearch, authors }) => {
    const [author, setAuthor] = useState("");
    const [order, setOrder] = useState("desc");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef(null);

    const handleSearch = () => {
        onSearch({ author: author.toLowerCase(), order: order });
        setSuggestions([]); // Limpiar sugerencias después de buscar
        setShowSuggestions(false); // Cerrar el dropdown al buscar
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setAuthor(value);

        if (value.length > 0) {
            // Filtrar autores que contienen el valor de búsqueda y eliminar duplicados
            const filteredSuggestions = authors
                .filter((a) => a.toLowerCase().includes(value.toLowerCase())) // Filtrar por el valor ingresado
                .filter((value, index, self) => self.indexOf(value) === index); // Eliminar duplicados

            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]); // No mostrar sugerencias si el campo está vacío
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setAuthor(suggestion);
        setSuggestions([]);
        setShowSuggestions(false); // Cerrar el dropdown al seleccionar una sugerencia
    };

    const handleInputClick = () => {
        setShowSuggestions(true); // Mostrar sugerencias al hacer clic
        if (author.length === 0) {
            // Si no hay texto, mostrar todas las sugerencias
            setSuggestions(authors);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false); // Cerrar las sugerencias al hacer clic fuera
                setSuggestions([]);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <div className="music-filters">
            <div className="musicInputContainer" ref={suggestionsRef}>
                <input
                    className="authorSearch"
                    type="text"
                    placeholder="Search by author"
                    value={author}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onClick={handleInputClick} // Mostrar las sugerencias al hacer clic
                />

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggestions-list">
                        {suggestions.map((suggestion, index) => (
                            <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <select
                className="orderSelect"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
            >
                <option value="asc">From oldest to newest</option>
                <option value="desc">From newest to oldest</option>
            </select>
            <button className="btnMusicBuscar" onClick={handleSearch}>Search</button>
        </div>
    );
};

export default MusicFilters;
