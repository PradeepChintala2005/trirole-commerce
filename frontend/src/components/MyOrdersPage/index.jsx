import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrdersAndItems = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const ordersList = data.data || [];
          
          const ordersWithItems = await Promise.all(ordersList.map(async (o) => {
              const itemsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${o.id}/items`, {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              if (itemsRes.ok) {
                  const itemsData = await itemsRes.json();
                  return { ...o, items: itemsData.data || [] };
              }
              return { ...o, items: [] };
          }));
          setOrders(ordersWithItems);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchOrdersAndItems();
  }, []);

  const getStatusInfo = (status) => {
      if (status === 'delivered') return { color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle size={18} /> };
      if (status === 'shipped') return { color: '#0277bd', bg: '#e1f5fe', icon: <Truck size={18} /> };
      return { color: '#f57c00', bg: '#fff3e0', icon: <Clock size={18} /> };
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', color: '#3e2723', marginBottom: '8px', fontWeight: '800' }}>My Nature Orders 📦</h1>
      <p style={{ color: '#6d4c41', fontSize: '18px', marginBottom: '32px' }}>Track your Ayurvedic products and order history.</p>

      {loading ? (
        <div style={{textAlign:'center', padding:'60px'}}><div className="loading-spinner"></div><div style={{marginTop:'12px', color: '#6d4c41', fontWeight: '600'}}>Fetching your orders...</div></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: '24px', padding: '80px 40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
           <div style={{ fontSize: '100px', marginBottom: '24px', opacity: 0.9 }}>🌱</div>
           <h2 style={{ color: '#3e2723', fontSize: '28px', marginBottom: '16px', fontWeight: '800' }}>No orders yet</h2>
           <p style={{ color: '#6d4c41', fontSize: '18px', marginBottom: '32px' }}>Looks like you haven't ordered any natural products yet!</p>
           <button onClick={() => navigate('/')} style={{ background: '#2e7d32', color: '#fff', padding: '16px 40px', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(46, 125, 50, 0.2)' }}>Explore Products</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map(o => {
            const statusInfo = getStatusInfo(o.status);
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e8f5e9' }}>
                 {/* Header */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f8e9', paddingBottom: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#3e2723', fontSize: '20px', fontWeight: '800' }}>Order #{o.id}</h3>
                        <p style={{ margin: 0, color: '#8d6e63', fontSize: '14px', fontWeight: '600' }}>Placed on: {new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: statusInfo.bg, color: statusInfo.color, padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {statusInfo.icon}
                        {o.status}
                    </div>
                 </div>

                 {/* Products List */}
                 <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#6d4c41', fontSize: '16px' }}>Items in this order:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {o.items && o.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f9fbf9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e8f5e9' }}>
                                <div style={{ width: '48px', height: '48px', background: '#f1f8e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🌱</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', color: '#3e2723', fontSize: '16px' }}>{item.product_name}</div>
                                    <div style={{ color: '#8d6e63', fontSize: '14px', fontWeight: '600' }}>Qty: {item.quantity} &times; ${Number(item.price_at_time).toFixed(2)}</div>
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>
                                    ${(Number(item.price_at_time) * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Footer */}
                 <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '2px dashed #e8f5e9', paddingTop: '20px' }}>
                     <div style={{ fontSize: '24px', fontWeight: '900', color: '#3e2723' }}>Total: <span style={{ color: '#2e7d32' }}>${Number(o.total).toFixed(2)}</span></div>
                 </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrdersPage;
