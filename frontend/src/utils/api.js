import axios from "axios";

const API = axios.create({
  baseURL: "/api", // This is proxied to http://localhost:5000 in vite.config.js
  withCredentials: true,
});

export default API;
