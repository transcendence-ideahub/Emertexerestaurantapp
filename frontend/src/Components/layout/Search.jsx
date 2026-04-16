import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getRestaurants } from "../../redux/actions/restaurantAction";

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { keyword } = useParams();
  const [searchTerm, setSearchTerm] = React.useState("");

  useEffect(() => {
    if (keyword) {
      setSearchTerm(keyword);
    }
  }, [keyword]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/eats/stores/search/${searchTerm}`);
      dispatch(getRestaurants(searchTerm));
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-box">
      <div className="row">
        <div className="col-8">
          <input
            type="text"
            className="form-control"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-4">
          <button type="submit" className="btn btn-primary btn-block">
            Search
          </button>
        </div>
      </div>
    </form>
  );
};

export default Search;
