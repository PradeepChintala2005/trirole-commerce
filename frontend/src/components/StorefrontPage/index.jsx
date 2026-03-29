import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart } from 'lucide-react';
import '../InventoryPage/index.css';

function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchFromUrl = searchParams.get('search') || '';

  let tempRole = 'guest';
  try {
      const stored = localStorage.getItem('user');
      if (stored && stored !== 'undefined') tempRole = JSON.parse(stored).role;
  } catch (e) {}
  const userRole = tempRole;

  useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  const fetchStore = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [prodRes, catRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory/categories`, { headers })
      ]);
      
      if (prodRes.ok) setProducts((await prodRes.json()).data || []);
      if (catRes.ok) setCategories((await catRes.json()).data || []);
      
    } catch (err) { console.error('Failed to fetch storefront data', err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStore(); }, []);

  const handleAddToCart = (product) => {
      let user = { role: 'guest' };
      try {
          const stored = localStorage.getItem('user');
          if (stored && stored !== 'undefined') user = JSON.parse(stored);
      } catch (e) {}

      if (user.role === 'guest') {
          toast.info('Please login or register to add items to cart!');
          // Redirect the guest to the login page cleanly
          navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
      }

      // Very simple local cart logic
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cart.find(x => x.product_id === product.id);
      
      if (existing) {
          if (existing.quantity >= product.stock) return toast.warn(`Only ${product.stock} in stock!`);
          existing.quantity += 1;
      } else {
          if (product.stock < 1) return toast.warn('Out of stock!');
          cart.push({
              product_id: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              max_stock: product.stock
          });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      toast.success(`${product.name} added to cart!`);
      // Optional: trigger re-render of TopNavbar cart count if it was listening to storage, 
      // but since it's local storage relying on React tree update, window event helps:
      window.dispatchEvent(new Event('storage'));
  };

  const filtered = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory ? p.category_id === parseInt(filterCategory) : true;
    const isActive = p.status === 'active';
    return matchesSearch && matchesCat && isActive;
  });

  return (
    <div style={{ padding: '0 32px 40px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Banner Section - Only visible if not searching */}
      {!searchTerm && (
        <div style={{ 
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', 
          borderRadius: '24px', 
          padding: '48px 60px', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          margin: '32px 0',
          boxShadow: '0 10px 25px -5px rgba(46, 125, 50, 0.4)'
        }}>
           <div>
             <h1 style={{ fontSize: '48px', margin: '0 0 16px 0', fontWeight: '800', letterSpacing: '-1px' }}>Chaturveda Ayurvedics 🌿</h1>
             <p style={{ fontSize: '20px', margin: 0, opacity: 0.9, maxWidth: '600px', lineHeight: 1.6, fontWeight: '500' }}>Discover inner peace and vital energy with our curated collection of ancient remedies, organic oils, and holistic wellness solutions.</p>
           </div>
           <div style={{ fontSize: '100px', opacity: 0.9, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>✨</div>
        </div>
      )}

      {/* Categories Bar */}
      {!searchTerm && (
         <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '26px', color: '#3e2723', marginBottom: '24px', fontWeight: '800' }}>Explore by Category</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
               <button onClick={() => setFilterCategory('')} style={{ padding: '12px 24px', borderRadius: '30px', border: filterCategory === '' ? 'none' : '2px solid #a5d6a7', background: filterCategory === '' ? '#2e7d32' : 'transparent', color: filterCategory === '' ? 'white' : '#2e7d32', fontWeight: '800', cursor: 'pointer', transition: '0.2s', fontSize: '16px' }}>All Natural 🌿</button>
               {categories.map(c => (
                   <button key={c.id} onClick={() => setFilterCategory(c.id.toString())} style={{ padding: '12px 24px', borderRadius: '30px', border: filterCategory === c.id.toString() ? 'none' : '2px solid #a5d6a7', background: filterCategory === c.id.toString() ? '#2e7d32' : 'transparent', color: filterCategory === c.id.toString() ? 'white' : '#2e7d32', fontWeight: '800', cursor: 'pointer', transition: '0.2s', fontSize: '16px' }}>{c.name}</button>
               ))}
            </div>
         </div>
      )}

      <div>
         <h2 style={{ fontSize: '26px', color: '#3e2723', marginBottom: '24px', fontWeight: '800' }}>
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Featured Collections'}
         </h2>
         <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px'}}>
             {loading ? <div style={{textAlign:'center', width:'100%', padding:'60px', gridColumn: '1 / -1'}}><div className="loading-spinner"></div><div style={{marginTop:'12px', color: '#6d4c41', fontWeight: '600'}}>Harvesting products...</div></div> : filtered.length === 0 ? <div style={{textAlign:'center', width:'100%', gridColumn: '1 / -1', padding: '60px', background: 'white', borderRadius: '24px', border: '2px dashed #a5d6a7'}}><p style={{fontSize:'20px', color:'#6d4c41', margin:0, fontWeight: '700'}}>No products matched your search 🌱</p></div> : (
                 filtered.map(p => (
                     <div key={p.id} className="store-product-card" style={{background: '#fff', border: '1px solid #e8f5e9', borderRadius: '24px', padding: '24px', display:'flex', flexDirection:'column', position: 'relative', overflow: 'hidden'}}>
                         <div style={{ height: '200px', background: '#f1f8e9', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '70px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                             🌱
                         </div>
                         <div style={{marginBottom:'12px'}}>
                           <span style={{ fontSize: '12px', fontWeight: '800', color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#e8f5e9', padding: '6px 12px', borderRadius: '8px' }}>
                             {p.category_name || 'Ayurvedic'}
                           </span>
                         </div>
                         <h3 style={{margin: '0 0 12px 0', fontSize: '20px', color: '#3e2723', fontWeight: '800', lineHeight: '1.4'}}>{p.name}</h3>
                         
                         {p.description && (
                            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6d4c41', lineHeight: '1.5' }}>
                               {p.description.length > 80 ? p.description.substring(0, 80) + '...' : p.description}
                            </p>
                         )}
                         
                         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:'20px'}}>
                             <strong style={{fontSize:'26px', fontWeight:'900', color:'#2e7d32'}}>${Number(p.price).toFixed(2)}</strong>
                             {['guest', 'customer'].includes(userRole) && (
                                 <button 
                                   onClick={() => handleAddToCart(p)}
                                   disabled={p.stock === 0}
                                   style={{
                                     background: p.stock === 0 ? '#cbd5e1' : '#2e7d32',
                                     color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                                     fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(46, 125, 50, 0.2)'
                                   }}
                                 >
                                     {p.stock === 0 ? 'Out of Stock' : <><ShoppingCart size={18}/> Add to Cart</>}
                                 </button>
                             )}
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
}

export default StorefrontPage;
