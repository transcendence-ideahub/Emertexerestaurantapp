import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097144.png",
  iconSize: [45, 45], iconAnchor: [22, 45],
});
const restaurantIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/685/685352.png",
  iconSize: [35, 35], iconAnchor: [17, 35],
});
const homeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1239/1239525.png",
  iconSize: [38, 38], iconAnchor: [19, 38],
});

const OrderTracker = ({ order }) => {
  const restaurantPos = order?.restaurant?.location?.coordinates
    ? [order.restaurant.location.coordinates[1], order.restaurant.location.coordinates[0]]
    : [22.5726, 88.3639];
    
  const customerPos = [22.5856, 88.4350]; 
  
  const [deliveryPos, setDeliveryPos] = useState(restaurantPos);
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(15);
  const [isArrived, setIsArrived] = useState(false);

  // BACKGROUND SYNC LOGIC (TIME-BASED)
  useEffect(() => {
    if (order.orderStatus !== "Out for Delivery" || !order.deliveryStartedAt) return;

    const interval = setInterval(() => {
      const startTime = new Date(order.deliveryStartedAt).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      const duration = 60000; // Match the 1-minute trip duration in Dashboard

      let step = elapsed / duration;
      if (step >= 1) {
        step = 1;
        setIsArrived(true);
      } else {
        setIsArrived(false);
      }

      const lat = restaurantPos[0] + (customerPos[0] - restaurantPos[0]) * step;
      const lng = restaurantPos[1] + (customerPos[1] - restaurantPos[1]) * step;
      const newPos = [lat, lng];
      
      setDeliveryPos(newPos);
      
      const dist = calculateDistance(lat, lng, customerPos[0], customerPos[1]);
      setDistance(dist.toFixed(1));
      setEta(Math.max(1, Math.round(dist * 2.5 + 2)));
    }, 1000);

    return () => clearInterval(interval);
  }, [order.orderStatus, order.deliveryStartedAt]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (order.orderStatus !== "Out for Delivery" && order.orderStatus !== "Delivered") {
    return (
      <div style={{ marginTop: '20px', padding: '18px', background: '#f8f9fa', borderRadius: '15px', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontWeight: '800', color: '#2c3e50', fontSize: '0.9rem' }}>{order.orderStatus.toUpperCase()}</span>
          <span style={{ color: '#e67e22', fontWeight: '900', fontSize: '0.9rem' }}>{order.orderStatus === 'Preparing' ? '👩‍🍳 Preparing' : '🕐 Processing'}</span>
        </div>
        <div style={{ height: '10px', background: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: order.orderStatus === 'Preparing' ? '66%' : '33%',
            background: 'linear-gradient(to right, #f39c12, #e67e22)',
            transition: 'width 2s'
          }} />
        </div>
      </div>
    );
  }

  const isAssigned = order.deliveryPerson && typeof order.deliveryPerson === 'object';
  const partnerAvatar = order.deliveryPerson?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(isAssigned ? order.deliveryPerson.name : "Partner")}&background=2c3e50&color=fff&size=100`;

  return (
    <div style={{ marginTop: '20px', border: '1px solid #eee', borderRadius: '24px', overflow: 'hidden', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
      
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <div style={{ color: '#95a5a6', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isArrived ? 'STATUS' : 'Estimated Arrival'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#2c3e50', marginTop: '4px' }}>
              {isArrived ? '📍 Arrived!' : `${eta} MINS`}
            </div>
          </div>
          
          {order.deliveryOtp && order.orderStatus === "Out for Delivery" && (
            <div style={{
              background: '#fff3cd', padding: '12px 24px', borderRadius: '18px', border: '2px solid #ffc107',
              textAlign: 'center', boxShadow: '0 8px 25px rgba(255,193,7,0.25)', animation: 'pulse-otp 2s infinite'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#856404', fontWeight: '900', textTransform: 'uppercase' }}>Delivery OTP</div>
              <div style={{ fontSize: '1.8rem', letterSpacing: '5px', fontWeight: '900', color: '#000' }}>{order.deliveryOtp}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f2f6' }}>
          <img 
            src={partnerAvatar} 
            alt="Delivery Partner" 
            style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '900', color: '#2c3e50', fontSize: '1rem' }}>
              {isAssigned ? order.deliveryPerson.name : "Assigning Partner..."}
            </div>
            {isAssigned && (
              <div style={{ color: '#e67e22', fontWeight: '800', fontSize: '0.85rem', marginTop: '4px' }}>
                📞 {order.deliveryPerson.phoneNumber}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#2ecc71', fontWeight: '900', fontSize: '0.85rem' }}>{isArrived ? 'Here!' : 'Live Tracking'}</div>
            <div style={{ color: '#95a5a6', fontSize: '0.7rem', fontWeight: '700' }}>SYNCED ACTIVE</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <MapContainer center={deliveryPos} zoom={15} style={{ height: "350px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={restaurantPos} icon={restaurantIcon}><Popup>Restaurant</Popup></Marker>
          <Marker position={customerPos} icon={homeIcon}><Popup>Home</Popup></Marker>
          <Marker position={deliveryPos} icon={deliveryIcon}><Popup>Delivery Partner</Popup></Marker>
          <Polyline positions={[restaurantPos, deliveryPos]} color="#f39c12" weight={4} dashArray="10" opacity={0.5} />
          <Polyline positions={[deliveryPos, customerPos]} color="#bdc3c7" weight={4} dashArray="10" opacity={0.5} />
          <MapController center={deliveryPos} />
        </MapContainer>

        <div style={{
          position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)',
          background: isArrived ? '#2ecc71' : 'white', padding: '10px 25px', borderRadius: '40px', fontWeight: '900',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)', fontSize: '0.9rem', color: isArrived ? 'white' : '#2c3e50',
          zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.5s'
        }}>
          <span>{isArrived ? '✨' : '🛵'}</span> 
          {isArrived ? 'ARRIVED AT YOUR LOCATION' : `${distance} km away`}
        </div>
      </div>

      <style>{`
        @keyframes pulse-otp {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 10px 30px rgba(255,193,7,0.4); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.panTo(center, { animate: true, duration: 1.5 }); }, [center, map]);
  return null;
}

export default OrderTracker;
