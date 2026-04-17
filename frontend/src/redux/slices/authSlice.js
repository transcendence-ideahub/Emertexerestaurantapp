import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    // Change isAuthenticated to false to see the Login button in the Header
    isAuthenticated: true, 
    user: {
      name: "Subhranil",
      avatar: {
        url: "https://via.placeholder.com/150",
      },
    },
    loading: false,
    error: null,
  },
  reducers: {
    // Logic for actual login, logout, and registration will be added here later
  },
});

export default authSlice.reducer;