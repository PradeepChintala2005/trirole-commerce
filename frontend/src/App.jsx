import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LayoutDashboard, Package, ShoppingCart, Users, UserCog, Store, Bookmark, LogOut, Menu, X } from 'lucide-react';
import './App.css'; 

import SidebarItem from './components/SidebarItem';
import DashboardOverview from './components/DashboardOverview';
import InventoryPage from './components/InventoryPage';
import OrdersPage from './components/OrdersPage';
import CustomersPage from './components/CustomersPage';
import Auth from './components/Auth';

// New Pages (We will build these next)
import UsersPage from './components/UsersPage';
import StorefrontPage from './components/StorefrontPage';
import CartPage from './components/CartPage';
import MyOrdersPage from './components/MyOrdersPage';

export const ROLE_ICONS = {
  admin: "🛡️",
  staff: "📋",
  customer: "🛍️",
  guest: "👋"
};

const ROLE_MENUS = {
  admin: [
    { path: '/', label: 'Store', icon: <Store size={20} /> },
    { path: '/admin', label: 'Admin Portal', icon: <LayoutDashboard size={20} /> },
    { path: '/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/users', label: 'Users', icon: <UserCog size={20} /> },
  ],
  staff: [
    { path: '/', label: 'Store', icon: <Store size={20} /> },
    { path: '/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> }
  ],
  customer: [
    { path: '/', label: 'Store', icon: <Store size={20} /> },
    { path: '/cart', label: 'My Cart', icon: <ShoppingCart size={20} /> },
    { path: '/my-orders', label: 'My Orders', icon: <Bookmark size={20} /> }
  ],
  guest: [
    { path: '/', label: 'Store', icon: <Store size={20} /> }
  ]
};

function Sidebar({ role, isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const menu = ROLE_MENUS[role] || [];

  return (
    <>
      {isOpen && <div className="mobile-overlay" onClick={closeSidebar} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{position: 'relative'}}>
          <h1 className="sidebar-title">TriRole Commerce</h1>
          <X className="close-sidebar-btn" size={24} onClick={closeSidebar} />
        </div>
      <nav className="sidebar-nav">
        {menu.map(item => (
          <div key={item.path} onClick={() => { navigate(item.path); closeSidebar(); }}>
            <SidebarItem icon={item.icon} label={item.label} isActive={location.pathname === item.path} />
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {role === 'guest' ? (
          <div onClick={() => { navigate('/login'); closeSidebar(); }} style={{cursor: 'pointer'}}>
            <SidebarItem icon={<LogOut style={{transform: 'rotate(180deg)'}} size={20} />} label="Login / Register" />
          </div>
        ) : (
          <div onClick={handleLogout} style={{cursor: 'pointer'}}>
            <SidebarItem icon={<LogOut size={20} />} label="Logout" />
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

function TopNavbar({ user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const handleSearch = (e) => {
      e.preventDefault();
      navigate(`/?search=${encodeURIComponent(search)}`);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="storefront-nav">
       {/* Logo */}
       <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
         <img src="/logo.webp" alt="Ayurvedic Logo" style={{ height: '44px', objectFit: 'contain' }} onError={(e)=>e.target.style.display='none'} />
         <span style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px' }}>AyurNaturals</span>
       </div>
       
       {/* Search */}
       <form onSubmit={handleSearch} className="storefront-search">
         <input type="text" placeholder="Search 100% natural ayurvedic products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: '12px 20px', borderRadius: '8px 0 0 8px', border: 'none', outline: 'none', color: '#3e2723', fontSize: '15px' }} />
         <button type="submit" style={{ padding: '12px 28px', background: '#a5d6a7', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', color: '#2e7d32', fontWeight: '800', fontSize: '15px' }}>Search</button>
       </form>

       {/* Actions */}
       <div className="storefront-actions">
          {user.role === 'guest' ? (
             <div onClick={() => navigate('/login')} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '15px', padding: '10px 20px', border: '2px solid #a5d6a7', borderRadius: '8px', transition: 'all 0.2s', background: 'transparent', textAlign: 'center' }}>Login / Register</div>
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div onClick={() => navigate('/my-orders')} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: '#fff', display: user.role === 'customer' ? 'block' : 'none' }}>My Orders</div>
                <div onClick={() => navigate(user.role === 'admin' ? '/admin' : '/inventory')} style={{cursor:'pointer', fontWeight: '700', fontSize: '15px', display: ['admin', 'staff'].includes(user.role) ? 'block' : 'none', padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px'}}>Admin Zone</div>
                <div onClick={handleLogout} style={{ cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>Logout ({user.username})</div>
             </div>
          )}
          
          <div onClick={() => navigate('/cart')} style={{ cursor: 'pointer', position: 'relative', display: ['admin', 'staff'].includes(user.role) ? 'none' : 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', background: '#1b5e20', padding: '10px 16px', borderRadius: '8px' }}>
             <ShoppingCart size={22} />
             <span>Cart</span>
             {cartCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e65100', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{cartCount}</span>}
          </div>
       </div>
    </header>
  );
}

function AppRoutes({ user, onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Routes>
      {/* Admin Routes */}
      {user.role === 'admin' && (
         <>
           <Route path="/" element={<StorefrontPage />} />
           <Route path="/admin" element={<DashboardOverview />} />
           <Route path="/inventory" element={<InventoryPage />} />
           <Route path="/orders" element={<OrdersPage />} />
           <Route path="/customers" element={<CustomersPage />} />
           <Route path="/users" element={<UsersPage />} />
           <Route path="*" element={<Navigate to="/" replace />} />
         </>
      )}

      {/* Staff Routes */}
      {user.role === 'staff' && (
         <>
           <Route path="/" element={<StorefrontPage />} />
           <Route path="/inventory" element={<InventoryPage />} />
           <Route path="/orders" element={<OrdersPage />} />
           <Route path="*" element={<Navigate to="/" replace />} />
         </>
      )}

      {/* Customer Routes */}
      {user.role === 'customer' && (
         <>
           <Route path="/" element={<StorefrontPage />} />
           <Route path="/cart" element={<CartPage />} />
           <Route path="/my-orders" element={<MyOrdersPage />} />
           <Route path="*" element={<Navigate to="/" replace />} />
         </>
      )}

      {/* Guest Routes */}
      {user?.role === 'guest' && (
         <>
           <Route path="/" element={<StorefrontPage />} />
           <Route path="/cart" element={<Navigate to="/login?redirect=/cart" replace />} />
           <Route path="/my-orders" element={<Navigate to="/login?redirect=/my-orders" replace />} />
           <Route path="*" element={<Navigate to="/" replace />} />
         </>
      )}

      {/* Login Route (Full Screen within Content) */}
      <Route path="/login" element={
         <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
             <button onClick={() => navigate('/')} style={{position:'absolute', top:'24px', left:'24px', padding:'10px 20px', borderRadius:'8px', background:'white', border:'1px solid #e2e8f0', cursor:'pointer', fontWeight:'600', color:'#1e293b', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', zIndex: 10000}}>← Back to Store</button>
             <div style={{flex: 1, overflowY: 'auto'}}>
                 <Auth onLoginSuccess={(u) => { 
                     onLoginSuccess(u); 
                     const redirectParams = new URLSearchParams(location.search);
                     if (redirectParams.has('redirect')) {
                         navigate(redirectParams.get('redirect'));
                     } else {
                         navigate(-1);
                     }
                 }} />
             </div>
         </div>
      } />
    </Routes>
  );
}

function AppLayout({ user, sidebarOpen, setSidebarOpen, handleLogin }) {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 400); // simulate router transition
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isStoreView = ['/', '/cart', '/my-orders'].includes(location.pathname);

  const getTitle = () => {
    const allMenus = [...ROLE_MENUS.admin, ...ROLE_MENUS.customer];
    const match = allMenus.find(m => m.path === location.pathname);
    if (match) return match.label;
    if (location.pathname === '/' && user?.role === 'admin') return 'Admin Dashboard';
    return 'Console';
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {isStoreView ? (
         <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
           <TopNavbar user={user} />
           {isNavigating && <div className="global-loading-bar" />}
           <div style={{ flex: 1 }}>
              <AppRoutes user={user} onLoginSuccess={handleLogin} />
           </div>
         </div>
      ) : (
         <div className="app-container">
           <Sidebar role={user.role} isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
           <main className="app-main" style={{position: 'relative'}}>
             {isNavigating && <div className="global-loading-bar" />}
             <header className="app-header">
                <div style={{display:'flex', alignItems:'center'}}>
                  <Menu className="mobile-nav-toggle" size={24} onClick={() => setSidebarOpen(true)} />
                  <h2 style={{textTransform: 'capitalize'}}>{getTitle()}</h2>
                </div>
                <div style={{fontWeight: 'bold', color: 'var(--brand-color)'}}>
                  {ROLE_ICONS[user?.role]} {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} | {user?.username}
                </div>
             </header>
             <div className="page-content">
               <AppRoutes user={user} onLoginSuccess={handleLogin} />
             </div>
           </main>
         </div>
      )}
    </>
  );
}


function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return (stored && stored !== 'undefined') ? JSON.parse(stored) : { role: 'guest', username: 'Guest' };
    } catch (e) {
      return { role: 'guest', username: 'Guest' };
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Double check user role is valid so UI doesn't crash on old tokens
  if (user.role !== 'guest' && !ROLE_MENUS[user.role]) {
      localStorage.clear();
      window.location.reload();
  }

  return (
    <Router>
      <AppLayout user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} handleLogin={handleLogin} />
    </Router>
  );
}

export default App;
