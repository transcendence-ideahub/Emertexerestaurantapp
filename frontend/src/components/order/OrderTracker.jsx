import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/OrderTracker.css";

// Fix for default marker icons in Leaflet with Webpack/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Delivery Man Icon
const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Restaurant Icon
const restaurantIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Home Icon
const homeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1239/1239525.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const OrderTracker = ({ order }) => {
  // Mock coordinates for demo (Kolkata region)
  const restaurantPos = [22.5726, 88.3639];
  const customerPos = [22.5856, 88.4350];
  
  const [deliveryPos, setDeliveryPos] = useState(restaurantPos);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(15);
  const [distance, setDistance] = useState(4.2);

  useEffect(() => {
    if (order.orderStatus === "Out for Delivery") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            clearInterval(interval);
            return 1;
          }
          return prev + 0.005; // Simulate movement
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order.orderStatus]);

  useEffect(() => {
    // Interpolate position between restaurant and customer
    const lat = restaurantPos[0] + (customerPos[0] - restaurantPos[0]) * progress;
    const lng = restaurantPos[1] + (customerPos[1] - restaurantPos[1]) * progress;
    setDeliveryPos([lat, lng]);

    // Update ETA and Distance
    setEta(Math.max(1, Math.round(15 * (1 - progress))));
    setDistance((4.2 * (1 - progress)).toFixed(1));
  }, [progress]);

  if (order.orderStatus !== "Out for Delivery" && order.orderStatus !== "Delivered") {
    return (
      <div className="tracking-status-simple">
        <div className="status-stepper">
          <div className={`step ${order.orderStatus === 'Processing' ? 'active' : 'done'}`}>
            <div className="step-dot"></div>
            <span>Order Placed</span>
          </div>
          <div className={`step ${order.orderStatus === 'Preparing' ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Preparing Food</span>
          </div>
          <div className="step">
            <div className="step-dot"></div>
            <span>Out for Delivery</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracker-container">
      <div className="tracker-header">
        <div className="eta-section">
          <span className="eta-label">Arriving in</span>
          <span className="eta-time">{order.orderStatus === 'Delivered' ? 'Delivered' : `${eta} MINS`}</span>
        </div>
        <div className="delivery-details">
          <div className="delivery-man">
            <img src="https://ui-avatars.com/api/?name=Ramesh+Delivery&background=e67e22&color=fff" alt="Delivery" />
            <div>
              <div className="man-name">Ramesh Kumar</div>
              <div className="man-rating">★ 4.8 (900+ orders)</div>
            </div>
          </div>
          <button className="call-btn">📞 Call</button>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer center={deliveryPos} zoom={13} style={{ height: "300px", width: "100%", borderRadius: "12px" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={restaurantPos} icon={restaurantIcon}>
            <Popup>{order.restaurant?.name || "Restaurant"}</Popup>
          </Marker>
          <Marker position={customerPos} icon={homeIcon}>
            <Popup>Your Location</Popup>
          </Marker>
          <Marker position={deliveryPos} icon={deliveryIcon}>
            <Popup>Delivery Partner is here</Popup>
          </Marker>
          <Polyline positions={[restaurantPos, deliveryPos]} color="#e67e22" dashArray="5, 10" />
          <Polyline positions={[deliveryPos, customerPos]} color="#bdc3c7" dashArray="5, 10" />
          <ChangeView center={deliveryPos} />
        </MapContainer>
        {order.orderStatus === 'Out for Delivery' && (
          <div className="distance-badge">
            🛵 {distance} km away
          </div>
        )}
      </div>
      
      <div className="tracker-footer">
        <p>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</p>
        <p className="status-text">{order.orderStatus === 'Delivered' ? 'Order was delivered' : 'Delivery partner is on the way to your location'}</p>
      </div>
    </div>
  );
};

// Helper component to recenter map
function ChangeView({ center }) {
  const map = useMap();
  // Only recenter if not delivered to allow user to pan
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default OrderTracker;
