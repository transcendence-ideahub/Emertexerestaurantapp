import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/layout/Header";
import Home from "./Components/Home";
import Menu from "./Components/Menu";
import Cart from "./cart/Cart";
import Login from "./Components/user/Login";
import Register from "./Components/user/Register";
import Profile from "./Components/user/Profile";
import UpdateProfile from "./Components/user/UpdateProfile";
import ForgotPassword from "./Components/user/ForgotPassword";
import NewPassword from "./Components/user/NewPassword";
import ListOrders from "./Components/order/ListOrders";
import OrderDetails from "./Components/order/OrderDetails";
import OrderSuccess from "./Components/cart/OrderSuccess";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="container container-fluid">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/eats/stores/search/:keyword" element={<Home />} />
            <Route path="/eats/stores/:id/menus" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            
            <Route path="/users/login" element={<Login />} />
            <Route path="/users/signup" element={<Register />} />
            <Route path="/users/me" element={<Profile />} />
            <Route path="/users/me/update" element={<UpdateProfile />} />
            <Route path="/users/forgetPassword" element={<ForgotPassword />} />
            <Route path="/users/resetPassword/:token" element={<NewPassword />} />
            
            <Route path="/eats/orders/me/myOrders" element={<ListOrders />} />
            <Route path="/eats/orders/:id" element={<OrderDetails />} />
            <Route path="/success" element={<OrderSuccess />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
