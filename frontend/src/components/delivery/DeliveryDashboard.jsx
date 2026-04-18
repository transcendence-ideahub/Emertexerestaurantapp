import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/685/685352.png',
  iconSize: [38, 38], iconAnchor: [19, 38],
});
const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png',
  iconSize: [38, 38], iconAnchor: [19, 38],
});
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097144.png',
  iconSize: [42, 42], iconAnchor: [21, 42],
});

const DeliveryDashboard = () => {
  const [user, setUser]             = useState(null);
  const [profile, setProfile]       = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [toggling, setToggling]     = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput]     = useState('');
  const [confirming, setConfirming] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  const lastPush = useRef(0);

  const fetchProfile = useCallback(async () => {
    try {
      const userRes = await fetch(`${BASE_URL}/users/me`, { credentials: 'include' });
      const userData = await userRes.json();
      if (!userRes.ok || !userData.success) { window.location.href = '/delivery/login'; return; }
      setUser(userData.user);

      const res = await fetch(`${BASE_URL}/delivery/profile`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProfile({ isAvailable: data.isAvailable, currentLocation: data.currentLocation });
        setActiveOrder(data.activeOrder || null);
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    const poll = setInterval(fetchProfile, 8000);
    return () => clearInterval(poll);
  }, [fetchProfile]);

  // SYNCED BACKGROUND SIMULATION (TIME-BASED)
  useEffect(() => {
    if (!activeOrder || !activeOrder.deliveryStartedAt) return;

    const restaurantPos = activeOrder.restaurant?.location?.coordinates
      ? [activeOrder.restaurant.location.coordinates[1], activeOrder.restaurant.location.coordinates[0]]
      : [22.5726, 88.3639];
    const customerPos = [22.5856, 88.4350]; 

    const interval = setInterval(() => {
      const startTime = new Date(activeOrder.deliveryStartedAt).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      const duration = 60000; // 1 minute trip for demo

      let step = elapsed / duration;
      if (step >= 1) {
        step = 1;
        setHasArrived(true);
        clearInterval(interval);
      } else {
        setHasArrived(false);
      }

      const lat = restaurantPos[0] + (customerPos[0] - restaurantPos[0]) * step;
      const lng = restaurantPos[1] + (customerPos[1] - restaurantPos[1]) * step;
      const loc = { lat, lng };
      
      setMyLocation(loc);
      
      // Update backend periodically so customer sees the car even if partner closes app
      // Wait, if partner closes app, this interval stops. 
      // BUT, the customer's app will use the SAME formula with SAME deliveryStartedAt!
      // So they will both see the SAME car at the SAME time.
      if (Date.now() - lastPush.current > 4000) {
        fetch(`${BASE_URL}/delivery/update-location`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loc),
        }).catch(() => {});
        lastPush.current = Date.now();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder?.deliveryStartedAt, !!activeOrder]);

  const toggleAvailability = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`${BASE_URL}/delivery/toggle-availability`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, isAvailable: data.isAvailable }));
        toast.success(data.isAvailable ? '🟢 Online' : '🔴 Offline');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setToggling(false);
    }
  };

  const confirmDelivery = async () => {
    if (!otpInput || otpInput.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setConfirming(true);
    try {
      const res = await fetch(`${BASE_URL}/delivery/confirm-delivery`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrder._id, otp: otpInput }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('🎉 Delivered!');
        setShowOtpModal(false);
        setOtpInput('');
        setHasArrived(false);
        fetchProfile();
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f1923', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🛵 Loading Dashboard...</div>;

  const restaurantPos = activeOrder?.restaurant?.location?.coordinates
    ? [activeOrder.restaurant.location.coordinates[1], activeOrder.restaurant.location.coordinates[0]]
    : null;
  const customerPos = [22.5856, 88.4350];
  const mapCenter = myLocation ? [myLocation.lat, myLocation.lng] : restaurantPos || [22.5726, 88.3639];

  const stats = {
    status: activeOrder ? (hasArrived ? 'Arrived at Location' : 'On Delivery') : (profile?.isAvailable ? 'Available' : 'Offline'),
    statusColor: activeOrder ? (hasArrived ? '#2ecc71' : '#f39c12') : (profile?.isAvailable ? '#2ecc71' : '#e74c3c'),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: '#1a1a2e', borderBottom: '4px solid #f39c12', padding: '15px 25px', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${user?.name}`} alt="Me" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f39c12', objectFit: 'cover' }} />
            <div>
              <div style={{ color: 'white', fontWeight: '800' }}>{user?.name}</div>
              <div style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '1px' }}>DELIVERY PARTNER</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                padding: '6px 16px', borderRadius: '20px', 
                background: `${stats.statusColor}22`, color: stats.statusColor, 
                fontWeight: '900', fontSize: '0.75rem', border: `1px solid ${stats.statusColor}55`
              }}>
                ● {stats.status}
              </span>
            </div>
            
            <div onClick={!activeOrder && !toggling ? toggleAvailability : undefined} style={{ 
              width: '54px', height: '28px', borderRadius: '14px', 
              background: profile?.isAvailable ? '#2ecc71' : '#e74c3c', 
              position: 'relative', cursor: activeOrder ? 'not-allowed' : 'pointer',
              opacity: activeOrder ? 0.6 : 1
            }}>
              <div style={{ 
                width: '22px', height: '22px', borderRadius: '50%', 
                background: 'white', position: 'absolute', top: '3px', 
                left: profile?.isAvailable ? '29px' : '3px', 
                transition: 'all 0.3s' 
              }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '25px' }}>

        {activeOrder ? (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #2c3e50, #1a1a2e)', borderRadius: '24px', padding: '30px', color: 'white', marginBottom: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#f39c12', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Active Order</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', marginTop: '8px' }}>Order #{activeOrder._id.substring(activeOrder._id.length - 8).toUpperCase()}</div>
                <div style={{ marginTop: '8px', fontWeight: '600', color: '#bdc3c7' }}>{activeOrder.orderItems?.length} items · ₹{activeOrder.totalPrice}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px 25px', background: 'rgba(243,156,18,0.1)', borderRadius: '20px', border: '1px solid #f39c12' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{hasArrived ? '🏁' : '🛵'}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: '#f39c12' }}>{hasArrived ? 'ARRIVED' : 'ON THE WAY'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'white', borderRadius: '24px', padding: '25px', borderLeft: '6px solid #f39c12', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ color: '#f39c12', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '10px' }}>🏪 Pickup</div>
                <div style={{ fontWeight: '900', color: '#2c3e50', fontSize: '1.1rem' }}>{activeOrder.restaurant?.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '4px' }}>{activeOrder.restaurant?.address}</div>
              </div>
              <div style={{ background: 'white', borderRadius: '24px', padding: '25px', borderLeft: '6px solid #2ecc71', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ color: '#2ecc71', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '10px' }}>🏠 Drop-off</div>
                <div style={{ fontWeight: '900', color: '#2c3e50', fontSize: '1.1rem' }}>{activeOrder.user?.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '4px' }}>{activeOrder.shippingInfo?.address}</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 15px 45px rgba(0,0,0,0.08)', marginBottom: '25px', height: '380px', position: 'relative' }}>
              <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {restaurantPos && <Marker position={restaurantPos} icon={restaurantIcon}><Popup>Restaurant</Popup></Marker>}
                <Marker position={customerPos} icon={customerIcon}><Popup>Customer</Popup></Marker>
                {myLocation && <Marker position={[myLocation.lat, myLocation.lng]} icon={deliveryIcon}><Popup>Live Sync</Popup></Marker>}
                {myLocation && restaurantPos && <Polyline positions={[[myLocation.lat, myLocation.lng], restaurantPos]} color="#f39c12" weight={4} dashArray="8" />}
                {myLocation && <Polyline positions={[[myLocation.lat, myLocation.lng], customerPos]} color="#bdc3c7" weight={4} dashArray="8" />}
                <MapController center={mapCenter} />
              </MapContainer>
            </div>

            <div style={{ background: hasArrived ? '#e8f5e9' : '#fff3cd', border: `2px dashed ${hasArrived ? '#2ecc71' : '#f1c40f'}`, borderRadius: '24px', padding: '30px', textAlign: 'center' }}>
              <button 
                onClick={hasArrived ? () => setShowOtpModal(true) : undefined}
                style={{ width: '100%', padding: '20px', background: hasArrived ? '#2ecc71' : '#bdc3c7', color: 'white', border: 'none', borderRadius: '20px', fontSize: '1.3rem', fontWeight: '900', cursor: hasArrived ? 'pointer' : 'not-allowed', boxShadow: hasArrived ? '0 10px 30px rgba(46,204,113,0.3)' : 'none' }}>
                {hasArrived ? 'CONFIRM DELIVERY (OTP)' : 'EN ROUTE TO CUSTOMER'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: '100px', marginBottom: '30px' }}>📡</div>
            <h1 style={{ fontWeight: '900', color: '#2c3e50' }}>{profile?.isAvailable ? 'Waiting for Orders' : 'You are Offline'}</h1>
            {!profile?.isAvailable && (
              <button onClick={toggleAvailability} style={{ padding: '18px 50px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' }}>GO ONLINE</button>
            )}
          </div>
        )}
      </div>

      {showOtpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', borderRadius: '32px', padding: '45px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ fontWeight: '900', color: '#2c3e50' }}>Verify Delivery</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Enter the customer's 6-digit OTP</p>
            <input type="text" maxLength="6" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', fontSize: '2.5rem', letterSpacing: '10px', textAlign: 'center', padding: '15px', border: '3px solid #eee', borderRadius: '20px', fontWeight: '900', marginBottom: '30px' }} />
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setShowOtpModal(false)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#f5f6fa', border: 'none', fontWeight: '800' }}>Cancel</button>
              <button onClick={confirmDelivery} disabled={confirming} style={{ flex: 2, padding: '15px', borderRadius: '15px', background: '#2ecc71', color: 'white', border: 'none', fontWeight: '900' }}>{confirming ? 'Wait...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { map.panTo(center, { animate: true, duration: 1.5 }); }, [center, map]);
  return null;
}

export default DeliveryDashboard;
