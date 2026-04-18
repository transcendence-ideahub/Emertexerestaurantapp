import React, { useState, useEffect, useRef } from 'react';
import './AddressAutocomplete.css';

const AddressAutocomplete = ({ 
  placeholder = "Search for address...", 
  onAddressSelect, 
  initialValue = "",
  className = "" 
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  };

  const handleSelect = (item) => {
    const addressLabel = item.display_name;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    setQuery(addressLabel);
    setSuggestions([]);
    setShowSuggestions(false);

    if (onAddressSelect) {
      onAddressSelect({
        address: addressLabel,
        lat,
        lng: lon
      });
    }
  };

  return (
    <div className={`address-autocomplete-wrapper ${className}`} ref={wrapperRef}>
      <div className="input-with-icon">
        <input
          type="text"
          className="form-control auth-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
        />
        {loading && <div className="spinner-border spinner-border-sm text-muted input-spinner" role="status"></div>}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list shadow">
          {suggestions.map((item, index) => (
            <li key={index} onClick={() => handleSelect(item)} className="suggestion-item">
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-text">
                <p className="suggestion-main">{item.display_name.split(',')[0]}</p>
                <p className="suggestion-sub">{item.display_name.split(',').slice(1).join(',').trim()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
