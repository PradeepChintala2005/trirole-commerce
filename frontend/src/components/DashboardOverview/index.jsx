import React, { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import './index.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function DashboardOverview() {
  const [stats, setStats] = useState({
    inventoryValue: '$0',
    totalProducts: '0',
    lowStock: '0',
    outOfStock: '0',
    monthlyOrders: [],
    topProducts: [],
    categoryDistribution: [],
    stockStatus: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const resData = await res.json();
          setStats(resData.data || resData);
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="dash-grid-top">
        <StatCard title="Inventory Value" value={stats.inventoryValue} trend="+0%" isPositive={true} />
        <StatCard title="Products" value={stats.totalProducts} trend="+0%" isPositive={true} />
        <StatCard title="Low Stock" value={stats.lowStock} trend="-0" isPositive={true} />
        <StatCard title="Out of Stock" value={stats.outOfStock} trend="+0" isPositive={false} />
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px'}}>
        {/* Graph 1: Monthly Orders */}
        <div style={{background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
           <h3 style={{marginTop: 0, marginBottom: '20px'}}>Monthly Orders</h3>
           <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyOrders || []}>
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} />
              </LineChart>
           </ResponsiveContainer>
        </div>

        {/* Graph 2: Top Selling Products */}
        <div style={{background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
           <h3 style={{marginTop: 0, marginBottom: '20px'}}>Top Selling Products</h3>
           <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProducts || []}>
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="sales" fill="#8884d8" />
              </BarChart>
           </ResponsiveContainer>
        </div>

        {/* Graph 3: Category Distribution */}
        <div style={{background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
           <h3 style={{marginTop: 0, marginBottom: '20px'}}>Category Distribution</h3>
           <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                 <Pie data={stats.categoryDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {(stats.categoryDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
              </PieChart>
           </ResponsiveContainer>
        </div>

        {/* Graph 4: Stock Status */}
        <div style={{background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
           <h3 style={{marginTop: 0, marginBottom: '20px'}}>Stock Status</h3>
           <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.stockStatus || []}>
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="count">
                    {(stats.stockStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Low Stock' || entry.name === 'Out of Stock' ? '#dc3545' : '#28a745'} />
                    ))}
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export default DashboardOverview;
