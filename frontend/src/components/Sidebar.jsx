import { NavLink } from 'react-router-dom';
import { 
  FaBook, 
  FaTags, 
  FaHistory, 
  FaCog, 
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { FiHome } from 'react-icons/fi';
import { useState } from 'react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigation = [
    { name: 'Home', href: '/', icon: FiHome },
    { name: 'Books', href: '/books', icon: FaBook },
    { name: 'Tags', href: '/tags', icon: FaTags },
    { name: 'History', href: '/history', icon: FaHistory },
    { name: 'Settings', href: '/settings', icon: FaCog },
  ];

  return (
    <div 
      className={`h-screen bg-white shadow-lg left-0 top-0 transition-all duration-300 z-50
        ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className={`text-xl font-bold text-blue-600 
            ${isCollapsed ? 'text-center' : 'text-left'}`}>
            {isCollapsed ? 'NFC' : 'NFC Book Manager'}
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors
                ${isCollapsed ? 'justify-center' : 'justify-start'}
                ${isActive 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-4 border-t border-gray-200 hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="flex justify-center">
            {isCollapsed ? (
              <FaChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <FaChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;