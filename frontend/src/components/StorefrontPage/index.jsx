import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ShoppingCart } from 'lucide-react';
import '../InventoryPage/index.css';

function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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
  };

  const filtered = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory ? p.category_id === parseInt(filterCategory) : true;
    const isActive = p.status === 'active';
    return matchesSearch && matchesCat && isActive;
  });

  return (
    <div>
      <div className="inv-header">
        <input type="text" placeholder="Search store..." className="inv-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select className="inv-search" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{marginLeft: '10px', width: '200px'}}>
           <option value="">All Categories</option>
           {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{marginLeft:'auto'}}>
            <a href="/cart" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none', color:'var(--brand-color)', fontWeight:'bold'}}>
                <ShoppingCart size={20}/> Go to Cart
            </a>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px'}}>
          {loading ? <div style={{textAlign:'center', width:'100%', padding:'40px'}}><div className="loading-spinner"></div><div style={{marginTop:'10px'}}>Loading store...</div></div> : filtered.length === 0 ? <p style={{textAlign:'center', width:'100%'}}>No products found 📦</p> : (
              filtered.map(p => (
                  <div key={p.id} style={{background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display:'flex', flexDirection:'column'}}>
                      <h3 style={{margin: '0 0 10px 0'}}>{p.name}</h3>
                      <p style={{margin: '0 0 5px 0', color: '#666', fontSize: '14px'}}>{p.category_name || 'Uncategorized'}</p>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:'15px'}}>
                          <strong style={{fontSize:'18px'}}>${Number(p.price).toFixed(2)}</strong>
                          <button 
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock === 0}
                            style={{
                              background: p.stock === 0 ? '#ccc' : 'var(--brand-color)',
                              color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: p.stock === 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                              {p.stock === 0 ? 'Out of Stock ❌' : 'Add to Cart 🛒'}
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
}

export default StorefrontPage;
