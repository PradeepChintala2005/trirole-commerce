import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import '../InventoryPage/index.css'; // Steal the table styling

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff' });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || data.error);
      
      setShowForm(false);
      setNewUser({ username: '', password: '', role: 'staff' });
      fetchUsers();
    } catch(err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.message);
      else fetchUsers();
    } catch(err) { console.error(err); }
  };

  return (
    <div>
      <div className="inv-header">
        <h3 style={{margin: 0}}>Admin User Management</h3>
        <button className="inv-add" style={{marginLeft: 'auto'}} onClick={() => setShowForm(!showForm)}>
          <Plus size={16}/> {showForm ? 'Cancel' : 'Create System User'}
        </button>
      </div>

      {showForm && (
        <form className="inv-header" onSubmit={handleCreate} style={{marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef'}}>
            <input required type="text" placeholder="Username" className="inv-search" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} style={{width: '25%'}}/>
            <input required type="password" placeholder="Password" className="inv-search" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{width: '25%'}}/>
            <select className="inv-search" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{width: '20%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}>
              <option value="staff">Staff (Limited View)</option>
              <option value="admin">Admin (Full Control)</option>
              <option value="customer">Customer (Storefront Only)</option>
            </select>
            <button type="submit" className="inv-add" style={{background: '#28a745'}}>Save Account</button>
        </form>
      )}

      <table className="inv-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>System Role</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Loading users...</td></tr>
          ) : users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td><strong>{u.username}</strong></td>
                <td>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                    background: u.role === 'admin' ? '#f8d7da' : u.role === 'staff' ? '#d1ecf1' : '#d4edda',
                    color: u.role === 'admin' ? '#721c24' : u.role === 'staff' ? '#0c5460' : '#155724'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleString()}</td>
                <td>
                    <button onClick={() => handleDelete(u.id)} style={{color: '#dc3545', background: 'transparent', border: 'none', cursor: 'pointer'}}>
                      <Trash2 size={18} />
                    </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersPage;
