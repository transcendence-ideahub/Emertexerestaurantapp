//user opens app
//we need restaurant data from Backend
//API call happens
//data stored in redux
//UI updates automatically

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

//get all restaurants
export const getRestaurants = createAsyncThunk(
    "restaurants/getRestaurants",async(keyword =" ",{rejectWithValue}) =>{
       try{
        //API call
        const {data} = await api.get(`/v1/eats/stores?keyword=${keyword}`);
        console.log("Fetched restaurants",data);
        return {
            restaurants : data.restaurants,
            count : data.count,
        }
       }catch(error){
         return rejectWithValue(error.response?.data?.message || error.message);
       }
    })


// CREATE RESTAURANT-admin
export const createRestaurant = createAsyncThunk(
  "restaurants/createRestaurant",
  async (restaurantData, { rejectWithValue }) => {
    try {
      // API call (POST)
      const { data } = await api.post("/v1/eats/stores", restaurantData);

      console.log("Restaurant created", data);

      return data; // backend response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);


// DELETE RESTAURANT - admin
export const deleteRestaurant = createAsyncThunk(
  "restaurants/deleteRestaurant",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/v1/eats/stores/${id}`);

      console.log("Restaurant deleted", data);

      return {
        id, // we only need id to remove from state
        message: data.message,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// ANALYZE REVIEWS
export const analyzeReviews = createAsyncThunk(
  "restaurants/analyzeReviews",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/v1/ai/admin/restaurants/${id}/analyze`
      );

      return {
        restaurantId: id,
        aiData: data.aiData,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "AI failed"
      );
    }
  }
);