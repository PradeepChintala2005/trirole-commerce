import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, History, Edit2 } from 'lucide-react';
import './index.css';

function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Create / Edit State
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', category_id: '', price: '', stock: '', status: 'active' });

  // Advanced Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortPrice, setSortPrice] = useState('none'); // none, asc, desc

  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [prodRes, catRes, histRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory/categories`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory/history`, { headers })
      ]);
      
      if (prodRes.ok) setProducts((await prodRes.json()).data || []);
      if (catRes.ok) setCategories((await catRes.json()).data || []);
      if (histRes.ok) setHistory((await histRes.json()).data || []);
      
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) await fetchData();
    } catch(err) { console.error(err); }
  };

  const handleEditClick = (p) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name,
      category_id: p.category_id || '',
      price: p.price,
      stock: p.stock,
      status: p.status
    });
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
      setShowAddForm(false);
      setEditingProduct(null);
      setNewProduct({ name: '', category_id: '', price: '', stock: '', status: 'active' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory/${editingProduct.id}` 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory`;

      const payload = { ...newProduct, category_id: newProduct.category_id || (categories[0]?.id || null) };

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        handleCancelForm();
        toast.success(editingProduct ? 'Product updated successfully ✅' : 'Product added successfully ✅');
        await fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Action failed');
      }
    } catch(err) { console.error(err); }
  };

  const handleAddCategory = async () => {
    const name = window.prompt("Enter new category name:");
    if (!name || !name.trim()) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inventory/categories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (res.ok) {
          await fetchData();
          setNewProduct({...newProduct, category_id: data.data.id}); // Auto-select it
      } else {
          toast.error(data.message || 'Failed to create category');
      }
    } catch(err) { console.error(err); }
  }

  const lowStockCount = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  let filtered = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory ? p.category_id === parseInt(filterCategory) : true;
    const matchesStatus = filterStatus === 'all' ? true : p.status === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  if (sortPrice === 'asc') filtered.sort((a,b) => Number(a.price) - Number(b.price));
  if (sortPrice === 'desc') filtered.sort((a,b) => Number(b.price) - Number(a.price));

  return (
    <div>
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
            ⚠️ <strong>Alert:</strong> You have {lowStockCount} items running low, and {outOfStockCount} items out of stock!
        </div>
      )}

      {/* Advanced Filters Bar */}
      <div className="inv-header" style={{flexWrap: 'wrap', gap: '10px'}}>
        <h3 style={{margin: 0, width: '100%'}}>Inventory Management</h3>
        <input type="text" placeholder="Search products..." className="inv-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        
        <select className="inv-search" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
           <option value="">All Categories</option>
           {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select className="inv-search" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
           <option value="all">Any Status</option>
           <option value="active">Active Only</option>
           <option value="inactive">Inactive Only</option>
        </select>

        <select className="inv-search" value={sortPrice} onChange={e => setSortPrice(e.target.value)} style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
           <option value="none">Sort: Default</option>
           <option value="asc">Price: Low to High</option>
           <option value="desc">Price: High to Low</option>
        </select>
        
        <div style={{marginLeft: 'auto', display: 'flex', gap: '10px'}}>
            {currentUser.role === 'admin' && (
              <button className="inv-add" style={{background: '#6c757d'}} onClick={() => setShowHistory(!showHistory)}>
              <History size={16}/> {showHistory ? 'Hide History' : 'Stock History'}
              </button>
            )}
            <button className="inv-add" onClick={showAddForm ? handleCancelForm : () => setShowAddForm(true)}>
            <Plus size={16}/> {showAddForm ? 'Cancel' : 'Add Product'}
            </button>
        </div>
      </div>

      {showAddForm && (
        <form className="inv-header" onSubmit={handleSubmit} style={{marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', flexWrap: 'wrap', gap: '10px'}}>
            <h4 style={{width: '100%', margin: '0 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px'}}>
               {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
            </h4>
            <input required type="text" placeholder="Name" className="inv-search" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{width: '20%'}}/>
            
            <div style={{display:'flex', width: '25%', gap: '5px'}}>
                <select required className="inv-search" value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: parseInt(e.target.value)})} style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={handleAddCategory} style={{padding: '0 10px', background:'#17a2b8', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer'}} title="Add new category">+</button>
            </div>

            <input required type="number" step="0.01" placeholder="Price ($)" className="inv-search" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} style={{width: '15%'}}/>
            <input required type="number" placeholder="Total Stock" className="inv-search" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} style={{width: '15%'}}/>
            
            <select className="inv-search" value={newProduct.status} onChange={e => setNewProduct({...newProduct, status: e.target.value})} style={{width: '15%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button type="submit" className="inv-add" style={{background: editingProduct ? '#007bff' : '#28a745'}}>
               {editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
        </form>
      )}

      {showHistory ? (
          <table className="inv-table" style={{marginTop: '20px'}}>
            <thead>
              <tr><th>Date</th><th>Product</th><th>Action</th><th>Amount</th><th>User</th></tr>
            </thead>
            <tbody>
              {history.map(h => (
                  <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleString()}</td>
                      <td><strong>{h.product_name}</strong></td>
                      <td><span style={{color: h.action_type === 'remove' ? 'red' : 'green', textTransform:'uppercase', fontWeight:'bold'}}>{h.action_type}</span></td>
                      <td>{h.change_amount > 0 ? `+${h.change_amount}` : h.change_amount}</td>
                      <td>{h.modified_by}</td>
                  </tr>
              ))}
            </tbody>
          </table>
      ) : (
          <table className="inv-table" style={{marginTop: '20px'}}>
            <thead>
              <tr><th>Name</th><th>Category</th><th>Price</th><th>Available Stock</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}><div className="loading-spinner"></div><div style={{marginTop:'10px'}}>Loading products...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No products matched filters.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category_name || 'Uncategorized'}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td><strong style={{color: p.stock === 0 ? 'red' : p.stock < 10 ? 'orange' : 'inherit'}}>{p.stock}</strong></td>
                  <td><span className={`status ${p.status === 'active' ? 'st-in' : 'st-out'}`}>{p.status}</span></td>
                  <td style={{display: 'flex', gap: '8px', borderBottom: 'none'}}>
                    <button onClick={() => handleEditClick(p)} style={{color: '#007bff', background: 'transparent', border: 'none', cursor: 'pointer', title:'Edit Product'}}>
                      <Edit2 size={18} />
                    </button>
                    {currentUser.role === 'admin' && (
                      <button onClick={() => handleDelete(p.id)} style={{color: '#dc3545', background: 'transparent', border: 'none', cursor: 'pointer'}} title="Delete Product">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
      )}
    </div>
  );
}

export default InventoryPage;
