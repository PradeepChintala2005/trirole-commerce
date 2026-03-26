import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ShoppingCart, Trash2 } from 'lucide-react';
import '../InventoryPage/index.css';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(saved);
  }, []);

  const removeItem = (id) => {
      const updated = cartItems.filter(i => i.product_id !== id);
      setCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
  };

  const clearCart = () => {
      setCartItems([]);
      localStorage.removeItem('cart');
  };

  const handleCheckout = async () => {
      if (cartItems.length === 0) return toast.warn("Your cart is empty!");

      try {
          const token = localStorage.getItem('auth_token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
            })
          });
          
          const result = await res.json();
          if (!res.ok) throw new Error(result.message || 'Checkout failed');
          
          toast.success('Checkout Successful! Order created.');
          clearCart();
          window.location.href = '/my-orders';
      } catch (err) { toast.error(err.message); }
  };

  const total = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div>
      <div className="inv-header">
        <h3 style={{margin: 0}}>Shopping Cart</h3>
        {cartItems.length > 0 && <button className="inv-add" style={{background: '#dc3545', marginLeft:'auto'}} onClick={clearCart}>Empty Cart</button>}
      </div>

      <table className="inv-table" style={{marginTop: '20px'}}>
        <thead>
          <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Action</th></tr>
        </thead>
        <tbody>
          {cartItems.length === 0 ? (
            <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Your cart is completely empty. Start shopping!</td></tr>
          ) : (
            cartItems.map(item => (
              <tr key={item.product_id}>
                <td><strong>{item.name}</strong></td>
                <td>${Number(item.price).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>${(Number(item.price) * item.quantity).toFixed(2)}</td>
                <td><Trash2 size={18} style={{color:'red', cursor:'pointer'}} onClick={() => removeItem(item.product_id)}/></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {cartItems.length > 0 && (
          <div style={{display:'flex', justifyContent:'flex-end', marginTop:'20px'}}>
              <div style={{background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'8px', padding:'20px', width:'300px', textAlign:'right'}}>
                  <h3 style={{margin:'0 0 15px 0'}}>Order Total: <span style={{color:'var(--brand-color)'}}>${total.toFixed(2)}</span></h3>
                  <button onClick={handleCheckout} style={{background:'var(--brand-color)', color:'#fff', padding:'10px 20px', border:'none', borderRadius:'6px', width:'100%', fontSize:'16px', fontWeight:'bold', cursor:'pointer'}}>
                      CHECKOUT
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}

export default CartPage;
