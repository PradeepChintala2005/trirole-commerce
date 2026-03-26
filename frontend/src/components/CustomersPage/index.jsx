import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import '../InventoryPage/index.css';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/customers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      if (res.ok) {
        setShowForm(false);
        setNewCustomer({ name: '', email: '', phone: '', address: '' });
        fetchCustomers();
      }
    } catch(err) { console.error(err); }
  };

  return (
    <div>
      <div className="inv-header">
        <h3 style={{margin: 0}}>Customer Management</h3>
        <button className="inv-add" style={{marginLeft: 'auto'}} onClick={() => setShowForm(!showForm)}>
          <Plus size={16}/> {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {showForm && (
        <form className="inv-header" onSubmit={handleCreate} style={{marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef'}}>
            <input required type="text" placeholder="Name" className="inv-search" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} style={{width: '20%'}}/>
            <input required type="email" placeholder="Email" className="inv-search" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} style={{width: '25%'}}/>
            <input type="text" placeholder="Phone" className="inv-search" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} style={{width: '15%'}}/>
            <input type="text" placeholder="Address" className="inv-search" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} style={{width: '30%'}}/>
            <button type="submit" className="inv-add" style={{background: '#28a745'}}>Save</button>
        </form>
      )}

      <table className="inv-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{textAlign:'center', padding:'40px'}}><div className="loading-spinner"></div><div style={{marginTop:'10px'}}>Loading customers...</div></td></tr>
          ) : customers.length === 0 ? (
            <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No customers found 👥</td></tr>
          ) : (
            customers.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone || 'N/A'}</td>
                <td>{c.address || 'N/A'}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CustomersPage;
