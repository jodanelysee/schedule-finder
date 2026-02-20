import React, { useState } from 'react';
import { useNavigate } from 'react-router';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${searchQuery}`);
    }
  };

  return (
    // Full width background - no max-width here
    <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section - full width */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Schedule Finder
        </h1>
        <p className="text-lg text-gray-600">
          Search for courses, view schedules, and view student information
        </p>
      </div>

      {/* Search Section - constrained width for readability */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Search for Courses
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Course Name or Code
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., CS-175, AN-103-01, Business Finance"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Search Courses
            </button>
          </form>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Quick tips:</span>
            </p>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>• Search "CS-175" to see all sections (CS-175-01, CS-175-02, etc.)</li>
              <li>• Search "AN-103-01" to see a specific section</li>
              <li>• Or browse by department using the navigation above</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links - constrained width */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/departments')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📚 Browse Departments
            </h3>
            <p className="text-gray-600 text-sm">
              View courses organized by department
            </p>
          </div>

          <div 
            onClick={() => navigate('/courses')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📖 All Courses
            </h3>
            <p className="text-gray-600 text-sm">
              Browse all available courses with filters
            </p>
          </div>

          <div 
            onClick={() => navigate('/students')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              👥 Students
            </h3>
            <p className="text-gray-600 text-sm">
              View student schedules and enrollments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;