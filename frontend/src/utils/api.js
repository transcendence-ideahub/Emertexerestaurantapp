// src/utils/api.js

// This is the main URL for your backend. 
// When you deploy your app later, you only need to change this one line.
const rawBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
// Ensure the URL ends with /api/v1
export const BASE_URL = rawBaseUrl.endsWith('/api/v1') 
  ? rawBaseUrl 
  : `${rawBaseUrl.replace(/\/$/, '')}/api/v1`;