import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LayoutDashboard, Package, ShoppingCart, Users, UserCog, Store, Bookmark, LogOut } from 'lucide-react';
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
  customer: "🛍️"
};

const ROLE_MENUS = {
  admin: [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/users', label: 'Users', icon: <UserCog size={20} /> },
  ],
  staff: [
    { path: '/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> }
  ],
  customer: [
    { path: '/store', label: 'Products', icon: <Store size={20} /> },
    { path: '/cart', label: 'My Cart', icon: <ShoppingCart size={20} /> },
    { path: '/my-orders', label: 'My Orders', icon: <Bookmark size={20} /> }
  ]
};

function Sidebar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const menu = ROLE_MENUS[role] || [];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand"><h1 className="sidebar-title">TriRole Commerce</h1></div>
      <nav className="sidebar-nav">
        {menu.map(item => (
          <div key={item.path} onClick={() => navigate(item.path)}>
            <SidebarItem icon={item.icon} label={item.label} isActive={location.pathname === item.path} />
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div onClick={handleLogout} style={{cursor: 'pointer'}}>
          <SidebarItem icon={<LogOut size={20} />} label="Logout" />
        </div>
      </div>
    </aside>
  );
}

function MainContent({ user }) {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 400); // simulate router transition
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const getTitle = () => {
    const allMenus = [...ROLE_MENUS.admin, ...ROLE_MENUS.customer];
    const match = allMenus.find(m => m.path === location.pathname);
    if (match) return match.label;
    if (location.pathname === '/' && user?.role === 'admin') return 'Admin Dashboard';
    return 'Page';
  };

  return (
    <main className="app-main" style={{position: 'relative'}}>
      {isNavigating && <div className="global-loading-bar" />}
      <header className="app-header">
        <h2 style={{textTransform: 'capitalize'}}>{getTitle()}</h2>
        <div style={{fontWeight: 'bold', color: 'var(--brand-color)'}}>
          {ROLE_ICONS[user?.role]} {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} | {user?.username || 'User'}
        </div>
      </header>
      <div className="page-content">
        <Routes>
          {/* Admin Routes */}
          {user.role === 'admin' && (
             <>
               <Route path="/" element={<DashboardOverview />} />
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
               <Route path="/inventory" element={<InventoryPage />} />
               <Route path="/orders" element={<OrdersPage />} />
               {/* Default redirect for staff since they have no dashboard */}
               <Route path="*" element={<Navigate to="/inventory" replace />} />
             </>
          )}

          {/* Customer Routes */}
          {user.role === 'customer' && (
             <>
               <Route path="/store" element={<StorefrontPage />} />
               <Route path="/cart" element={<CartPage />} />
               <Route path="/my-orders" element={<MyOrdersPage />} />
               <Route path="*" element={<Navigate to="/store" replace />} />
             </>
          )}
        </Routes>
      </div>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated || !user) {
    return <Auth onLoginSuccess={handleLogin} />;
  }

  // Double check user role is valid so UI doesn't crash on old tokens
  if (!ROLE_MENUS[user.role]) {
      localStorage.clear();
      window.location.reload();
  }

  return (
    <Router>
      <div className="app-container">
        <ToastContainer position="top-right" autoClose={3000} />
        <Sidebar role={user.role} />
        <MainContent user={user} />
      </div>
    </Router>
  );
}

export default App;
