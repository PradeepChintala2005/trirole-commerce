import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, Trash2, ArrowLeft, Minus, Plus } from 'lucide-react';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(saved);
    // Auto-select all items by default (common in e-commerce)
    setSelectedItems(saved.map(i => i.product_id));
  }, []);

  const updateQuantity = (id, delta) => {
    let cart = [...cartItems];
    let item = cart.find(i => i.product_id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return removeItem(id);
    if (newQuantity > item.max_stock) return toast.warn(`Only ${item.max_stock} available!`);

    item.quantity = newQuantity;
    setCartItems(cart);
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (id) => {
      const updated = cartItems.filter(i => i.product_id !== id);
      setCartItems(updated);
      setSelectedItems(prev => prev.filter(pId => pId !== id)); // Remove from selection
      localStorage.setItem('cart', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      toast.info('Item removed from cart 🗑️');
  };

  const toggleSelect = (id) => {
      setSelectedItems(prev => 
          prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
      );
  };

  const toggleSelectAll = () => {
      if (selectedItems.length === cartItems.length) {
          setSelectedItems([]);
      } else {
          setSelectedItems(cartItems.map(i => i.product_id));
      }
  };

  const handleCheckout = async () => {
      const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product_id));

      if (cartItems.length === 0) return toast.warn("Your cart is empty!");
      if (selectedCartItems.length === 0) return toast.warn("Please select at least one item to proceed to checkout!");

      try {
          const token = localStorage.getItem('auth_token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: selectedCartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
            })
          });
          
          const result = await res.json();
          if (!res.ok) throw new Error(result.message || 'Checkout failed');
          
          toast.success('Checkout Successful! Your Ayurvedic order has been placed. 🌿');
          
          // Selective clearance: Keep unselected items in the cart!
          const remainingItems = cartItems.filter(i => !selectedItems.includes(i.product_id));
          setCartItems(remainingItems);
          setSelectedItems([]);
          localStorage.setItem('cart', JSON.stringify(remainingItems));
          window.dispatchEvent(new Event('storage'));
          
          navigate('/my-orders');
      } catch (err) { toast.error(err.message); }
  };

  const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product_id));
  const total = selectedCartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalItems = selectedCartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#2e7d32', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', fontSize: '16px' }}>
         <ArrowLeft size={18} /> Continue Shopping
      </button>
      
      <h1 style={{ fontSize: '32px', color: '#3e2723', marginBottom: '32px', fontWeight: '800' }}>Your Ayurvedic Cart 🛒</h1>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: '24px', padding: '80px 40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
           <div style={{ fontSize: '100px', marginBottom: '24px', opacity: 0.9 }}>🌿</div>
           <h2 style={{ color: '#3e2723', fontSize: '28px', marginBottom: '16px', fontWeight: '800' }}>Your cart is empty</h2>
           <p style={{ color: '#6d4c41', fontSize: '18px', marginBottom: '32px' }}>Start adding some natural goodness to your cart!</p>
           <button onClick={() => navigate('/')} style={{ background: '#2e7d32', color: '#fff', padding: '16px 40px', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(46, 125, 50, 0.2)' }}>Shop Nature Now</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
           
           {/* Cart Items List */}
           <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', gridColumn: '1 / -1', '@media (min-width: 900px)': { gridColumn: 'span 2' } }}>
               
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e8f5e9', paddingBottom: '20px', marginBottom: '24px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>
                      <input type="checkbox" checked={selectedItems.length === cartItems.length && cartItems.length > 0} onChange={toggleSelectAll} style={{ width: '20px', height: '20px', accentColor: '#2e7d32', cursor: 'pointer' }} />
                      SELECT ALL ITEMS
                   </label>
                   <span style={{ color: '#6d4c41', fontWeight: '600' }}>{cartItems.length} items total</span>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                   {cartItems.map((item, index) => (
                       <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: index !== cartItems.length - 1 ? '32px' : '0', borderBottom: index !== cartItems.length - 1 ? '1px solid #f1f8e9' : 'none', flexWrap: 'wrap' }}>
                           <input type="checkbox" checked={selectedItems.includes(item.product_id)} onChange={() => toggleSelect(item.product_id)} style={{ width: '22px', height: '22px', accentColor: '#2e7d32', cursor: 'pointer', marginTop: '-40px' }} />
                           
                           <div style={{ width: '120px', height: '120px', background: '#f1f8e9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', border: '1px solid #e8f5e9' }}>🌱</div>
                           
                           <div style={{ flex: 1, minWidth: '200px' }}>
                               <h3 style={{ margin: '0 0 8px 0', color: '#3e2723', fontSize: '20px', fontWeight: 'bold' }}>{item.name}</h3>
                               <p style={{ margin: '0 0 16px 0', color: '#2e7d32', fontWeight: '800', fontSize: '22px' }}>${Number(item.price).toFixed(2)}</p>
                               
                               <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                                   {/* Quantity Controls */}
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f9fbf9', padding: '6px', borderRadius: '12px', border: '1px solid #e8f5e9' }}>
                                       <button onClick={() => updateQuantity(item.product_id, -1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', color: '#3e2723', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Minus size={16} /></button>
                                       <span style={{ fontWeight: 'bold', fontSize: '18px', minWidth: '24px', textAlign: 'center', color: '#2e7d32' }}>{item.quantity}</span>
                                       <button onClick={() => updateQuantity(item.product_id, 1)} disabled={item.quantity >= item.max_stock} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', color: item.quantity >= item.max_stock ? '#cbd5e1' : '#3e2723', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: item.quantity >= item.max_stock ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Plus size={16} /></button>
                                   </div>

                                   <button onClick={() => removeItem(item.product_id)} style={{ background: 'transparent', border: 'none', color: '#6d4c41', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '15px', transition: '0.2s' }} onMouseOver={e => e.target.style.color='#e53935'} onMouseOut={e => e.target.style.color='#6d4c41'}>
                                       <Trash2 size={18} /> Remove
                                   </button>
                               </div>
                           </div>
                           <div style={{ fontWeight: '800', fontSize: '20px', color: '#3e2723', minWidth: '80px', textAlign: 'right' }}>
                               ${(item.price * item.quantity).toFixed(2)}
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* Order Summary */}
           <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'sticky', top: '100px', alignSelf: 'start', gridColumn: 'span 1' }}>
               <h3 style={{ margin: '0 0 24px 0', borderBottom: '2px solid #e8f5e9', paddingBottom: '16px', color: '#3e2723', fontSize: '22px', fontWeight: '800' }}>Order Summary</h3>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#6d4c41', fontSize: '16px' }}>
                   <span>Selected Items ({totalItems})</span>
                   <span style={{ fontWeight: 'bold' }}>${total.toFixed(2)}</span>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', color: '#6d4c41', fontSize: '16px' }}>
                   <span>Delivery Charges</span>
                   <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>FREE</span>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #a5d6a7', paddingTop: '24px', marginBottom: '32px', color: '#3e2723', fontSize: '26px', fontWeight: '900' }}>
                   <span>Total</span>
                   <span>${total.toFixed(2)}</span>
               </div>
               
               <button onClick={handleCheckout} style={{ background: '#2e7d32', color: '#fff', width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)' }} onMouseOver={e => e.target.style.transform='translateY(-2px)'} onMouseOut={e => e.target.style.transform='translateY(0)'}>
                   Checkout Now ({totalItems})
               </button>
               <p style={{ textAlign: 'center', margin: '16px 0 0 0', fontSize: '13px', color: '#8d6e63', fontWeight: '600' }}>Safe and secure natural checkout 🌿</p>
           </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
