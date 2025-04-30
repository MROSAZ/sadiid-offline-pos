import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Users, Settings, ShoppingBag } from 'lucide-react';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/products', label: 'Products', icon: <ShoppingCart size={20} /> },
    { to: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { to: '/pos', label: 'Point of Sale', icon: <ShoppingCart size={20} /> },
    { to: '/sales', label: 'Sales', icon: <ShoppingBag size={20} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-sadiid-800 text-white transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center justify-center h-16 border-b border-sadiid-700`}>
          {!collapsed ? (
            <h1 className="text-xl font-bold text-white">Sadiid POS</h1>
          ) : (
            <h1 className="text-xl font-bold text-white">SP</h1>
          )}
        </div>

        {/* Nav items */}
        <div className="flex-1 py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.to} className="mb-1">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 ${
                      isActive ? 'bg-sadiid-700 text-white' : 'text-sadiid-200 hover:bg-sadiid-700'
                    } transition-colors duration-200`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span className="ml-4">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Collapse button */}
        <div className="p-4 border-t border-sadiid-700">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center bg-sadiid-700 hover:bg-sadiid-600 text-white py-2 rounded transition-colors"
          >
            {collapsed ? '>>' : '<<'}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
