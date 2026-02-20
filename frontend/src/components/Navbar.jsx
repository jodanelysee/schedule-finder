import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Departments', path: '/departments' },
    { name: 'Courses', path: '/courses' },
    { name: 'Students', path: '/students' },
  ];

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
            {navItems.map((item) => (
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
            {navItems.map((item) => (
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
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;