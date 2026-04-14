import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Departments', path: '/departments' },
    { name: 'Courses', path: '/courses' },
    { name: 'Students', path: '/students' },
  ];

  // Don't show login on login page
  const showLoginButton = !user && location.pathname !== '/login';

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className='w-full bg-white shadow-md fixed top-0 left-0 right-0 z-50'>
      <nav className='py-4 px-4 lg:px-24'>
        <div className='flex justify-between items-center'>
          {/* Logo/Brand */}
          <Link to="/" className='text-2xl font-bold text-blue-600 flex items-center'>
            Student Schedule Finder
          </Link>

          {/* Desktop Navigation */}
          <ul className='hidden md:flex space-x-8 items-center'>
            {user && navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-base font-medium transition-colors ${
                  isActive(item.path) && (item.path === '/' ? location.pathname === '/' : true)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Auth buttons */}
            {user ? (
              <div className="ml-4 flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.first_name}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : showLoginButton && (
              <Link
                to="/login"
                className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            )}
          </ul>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={toggleMenu}
              className='text-gray-700 hover:text-blue-600 focus:outline-none'
            >
              {isOpen ? (
                <XMarkIcon className='h-6 w-6' />
              ) : (
                <Bars3Icon className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
          <ul className='mt-4 space-y-2'>
            {user && navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block py-2 px-4 text-base font-medium transition-colors rounded ${
                  isActive(item.path) && (item.path === '/' ? location.pathname === '/' : true)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <div className="px-4 py-2 text-sm text-gray-700">
                  Welcome, {user.first_name}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : showLoginButton && (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
              >
                Login
              </Link>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;