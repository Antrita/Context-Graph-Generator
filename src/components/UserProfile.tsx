import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, BarChart3, ChevronDown } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // If user is not logged in, show sign in button
  if (!user) {
    return (
      <Link to="/login">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
          Sign In
        </button>
      </Link>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const displayName = user.displayName || user.email || 'User';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 text-sm rounded-lg px-3 py-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <img
          className="h-8 w-8 rounded-full border-2 border-gray-200"
          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B82F6&color=fff&size=32`}
          alt="Profile"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B82F6&color=fff&size=32`;
          }}
        />
        <span className="hidden md:block text-gray-700 font-medium max-w-24 truncate">
          {firstName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
        />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <img
                className="h-10 w-10 rounded-full"
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3B82F6&color=fff&size=40`}
                alt="Profile"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setShowDropdown(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <BarChart3 className="h-4 w-4 mr-3 text-gray-400" />
              Dashboard
            </Link>
            
            <button
              onClick={() => {
                setShowDropdown(false);
                // Add navigation to profile settings if needed
                console.log('Navigate to profile settings');
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <User className="h-4 w-4 mr-3 text-gray-400" />
              Profile Settings
            </button>
            
            <button
              onClick={() => {
                setShowDropdown(false);
                // Add navigation to app settings if needed
                console.log('Navigate to app settings');
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-400" />
              Settings
            </button>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
          >
            <LogOut className="h-4 w-4 mr-3 text-red-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
