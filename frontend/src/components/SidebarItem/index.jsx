import React from 'react';
import './index.css';

function SidebarItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`sidebar-btn ${isActive ? 'active' : ''}`}>
      {icon} <span>{label}</span>
    </button>
  );
}
export default SidebarItem;
