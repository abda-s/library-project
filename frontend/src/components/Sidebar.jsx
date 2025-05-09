import { NavLink } from 'react-router-dom';
import { 
  FaBook, 
  FaTags, 
  FaHistory,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaSignOutAlt // Added Logout icon
} from 'react-icons/fa';
import { FiHome } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate for logout redirect

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth(); // Get user and logout function
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  const navigation = [
    { name: 'Home', href: '/', icon: FiHome },
    { name: 'Books', href: '/books', icon: FaBook },
    // { name: 'History', href: '/history', icon: FaHistory }, // Assuming /history is not yet implemented
    // { name: 'Settings', href: '/settings', icon: FaCog }, // Assuming /settings is not yet implemented
    { name: 'Profile', href: '/profile', icon: FaUserCog }, // Added Profile link
  ];

  return (
    <div
      className={`h-screen bg-white shadow-lg left-0 top-0 transition-all duration-300 z-50
        ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Header & User Info */}
        <div className="p-4 border-b border-gray-200">
          <h1 className={`text-xl font-bold text-blue-600 ${isCollapsed ? 'text-center' : 'text-left'}`}>
            {isCollapsed ? 'NFC' : 'NFC Book Manager'}
          </h1>
          {user && !isCollapsed && (
            <div className="mt-2 text-left">
              <p className="text-sm font-semibold text-gray-700 truncate" title={user.username}>{user.username}</p>
              <p className="text-xs text-gray-500 capitalize truncate" title={user.role}>{user.role}</p>
            </div>
          )}
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

        {/* Logout Button (now separated from user info) */}
        {user && (
          <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'py-4' : ''}`}>
            <button
              onClick={handleLogout}
              className={`flex items-center p-3 rounded-lg transition-colors w-full
                ${isCollapsed ? 'justify-center' : 'justify-start'}
                text-gray-600 hover:bg-red-100 hover:text-red-600`}
              title="Logout"
            >
              <FaSignOutAlt className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 font-medium">Logout</span>
              )}
            </button>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-4 border-t border-gray-200 hover:bg-gray-100 transition-colors" // Removed mt-auto, logout button will push it down
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