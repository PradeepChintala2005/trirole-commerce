import React, { useState, useEffect } from 'react';
import '../InventoryPage/index.css';

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        // Due to the Controller logic, this strictly returns only their OWN orders
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data || []);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <div className="inv-header">
        <h3 style={{margin: 0}}>My Order History</h3>
      </div>

      <table className="inv-table" style={{marginTop: '20px'}}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date Placed</th>
            <th>Total Paid</th>
            <th>Fulfillment Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>Loading orders...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>You have not placed any orders yet.</td></tr>
          ) : (
            orders.map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td>${Number(o.total).toFixed(2)}</td>
                <td>
                  <span style={{
                      padding: '6px 10px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: o.status === 'delivered' ? '#d4edda' : o.status === 'shipped' ? '#cce5ff' : '#fff3cd',
                      color: o.status === 'delivered' ? '#155724' : o.status === 'shipped' ? '#004085' : '#856404',
                  }}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MyOrdersPage;
