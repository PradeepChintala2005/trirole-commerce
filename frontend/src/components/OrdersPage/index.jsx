import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import '../InventoryPage/index.css';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Order Modal State
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cartItems, setCartItems] = useState([]); // [{product_id, quantity, name, price}]
  
  // Temporary state for the "Add to Cart" row
  const [tempProduct, setTempProduct] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [ordRes, custRes, prodRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/customers`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory`, { headers })
      ]);

      if (ordRes.ok) setOrders((await ordRes.json()).data || []);
      if (custRes.ok) setCustomers((await custRes.json()).data || []);
      if (prodRes.ok) setProducts((await prodRes.json()).data || []);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchAllData();
    } catch(err) { console.error(err); }
  };

  const handleAddToCart = () => {
      if (!tempProduct) return toast.warn("Select a product first.");
      const p = products.find(x => x.id.toString() === tempProduct.toString());
      if (p.stock < tempQuantity) return toast.warn(`Not enough stock! Only ${p.stock} left.`);
      
      setCartItems([...cartItems, {
          product_id: p.id,
          name: p.name,
          price: p.price,
          quantity: tempQuantity
      }]);
      setTempProduct('');
      setTempQuantity(1);
  };

  const removeFromCart = (index) => {
      const newCart = [...cartItems];
      newCart.splice(index, 1);
      setCartItems(newCart);
  };

  const handleCreateOrder = async (e) => {
      e.preventDefault();
      if (!selectedCustomerId) return toast.warn("Please select a customer.");
      if (cartItems.length === 0) return toast.warn("Please add at least one item to the order.");

      try {
          const token = localStorage.getItem('auth_token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: selectedCustomerId,
                items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
            })
          });
          
          const result = await res.json();
          if (!res.ok) throw new Error(result.message || result.error || 'Failed to create order');
          
          toast.success('Order placed successfully 🛒');
          setShowForm(false);
          setCartItems([]);
          setSelectedCustomerId('');
          fetchAllData(); // Refresh orders and products
      } catch (err) {
          toast.error(err.message);
      }
  };

  return (
    <div>
      <div className="inv-header">
        <h3 style={{margin: 0}}>Order Management</h3>
        <button className="inv-add" style={{marginLeft: 'auto'}} onClick={() => setShowForm(!showForm)}>
          <Plus size={16}/> {showForm ? 'Cancel Creation' : 'Create Order'}
        </button>
      </div>

      {showForm && (
          <div style={{marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef'}}>
              <h4 style={{marginTop: 0}}>Draft New Order</h4>
              
              <div style={{marginBottom: '15px'}}>
                  <label><strong>1. Select Customer: </strong></label>
                  <select className="inv-search" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} style={{width: '250px', padding: '8px'}}>
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                  <span style={{marginLeft: '10px', fontSize: '12px', color: '#666'}}>*Create customers in the Customers tab first.</span>
              </div>

              <div style={{marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <label><strong>2. Add Line Items: </strong></label>
                  <select className="inv-search" value={tempProduct} onChange={e => setTempProduct(e.target.value)} style={{width: '200px', padding: '8px'}}>
                      <option value="">-- Select Product --</option>
                      {products.filter(p => p.stock > 0).map(p => (
                          <option key={p.id} value={p.id}>{p.name} (${p.price} | Stock: {p.stock})</option>
                      ))}
                  </select>
                  <input type="number" min="1" value={tempQuantity} onChange={e => setTempQuantity(parseInt(e.target.value) || 1)} className="inv-search" style={{width: '80px', padding: '8px'}} />
                  <button onClick={handleAddToCart} className="inv-add" style={{background: '#6c757d'}}>Add</button>
              </div>

              {cartItems.length > 0 && (
                  <table className="inv-table" style={{marginBottom: '15px', background: '#fff'}}>
                      <thead>
                          <tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                          {cartItems.map((item, idx) => (
                              <tr key={idx}>
                                  <td>{item.name}</td>
                                  <td>{item.quantity}</td>
                                  <td>${item.price}</td>
                                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                                  <td><Trash2 size={16} style={{cursor:'pointer', color:'red'}} onClick={() => removeFromCart(idx)}/></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}

              <button className="inv-add" style={{background: '#28a745', width: '100%'}} onClick={handleCreateOrder}>
                  Submit Final Order
              </button>
          </div>
      )}

      <table className="inv-table" style={{marginTop: '20px'}}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" style={{textAlign:'center', padding:'40px'}}><div className="loading-spinner"></div><div style={{marginTop:'10px'}}>Loading orders...</div></td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>No orders yet 📦</td></tr>
          ) : (
            orders.map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{o.customer_name}</td>
                <td>{o.customer_email}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>${Number(o.total).toFixed(2)}</td>
                <td>
                  <select 
                    value={o.status} 
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{
                      padding: '6px', 
                      borderRadius: '4px',
                      background: o.status === 'delivered' ? '#d4edda' : o.status === 'shipped' ? '#cce5ff' : '#fff3cd',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersPage;
