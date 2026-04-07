import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';

const DepartmentCourses = () => {
  const { authenticatedFetch } = useAuth();
  const { department } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    professor: searchParams.get('professor') || '',
    term: searchParams.get('term') || '',
    level: searchParams.get('level') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });

  const getDepartmentName = (code) => {
    const names = {
      'AN': 'Anthropology', 'AR': 'Art', 'BE': 'Business Economics', 'BF': 'Business Finance',
      'BM': 'Business Management', 'CS': 'Computer Science', 'EN': 'English', 'GL': 'Geology',
      'GIS': 'Geographic Information Systems', 'HI': 'History', 'MA': 'Mathematics', 'MU': 'Music',
      'PH': 'Philosophy', 'PS': 'Political Science', 'PY': 'Psychology', 'SE': 'Software Engineering',
      'SO': 'Sociology', 'ASL': 'American Sign Language', 'BA': 'Business Accounting',
      'BI': 'Business International', 'BK': 'Business Marketing', 'BL': 'Business Law',
      'BR': 'Business Real Estate', 'BY': 'Biology', 'CE': 'Chemistry', 'CJ': 'Criminal Justice',
      'CO': 'Communication', 'DA': 'Dance', 'ED': 'Education', 'EDL': 'Educational Leadership',
      'EDS': 'Special Education', 'FF': 'Foreign Language: French', 'FG': 'Foreign Language: German',
      'FL': 'Foreign Language: Latin', 'FS': 'Foreign Language: Spanish', 'FI': 'Foreign Language: Italian',
      'FO': 'Foreign Language', 'GS': 'Gender Studies', 'HE': 'Health Studies',
      'HLS': 'Homeland Security', 'HO': 'Honors', 'HS': 'History', 'HU': 'Humanities',
      'IT': 'Information Technology', 'ML': 'Medical Laboratory Science', 'NU': 'Nursing',
      'PE': 'Physical Education', 'PL': 'Philosophy', 'PO': 'Public Policy', 'PR': 'Perspectives',
      'RS': 'Religious Studies', 'SC': 'Science', 'SLP': 'Speech Language Pathology', 'SW': 'Social Work',
      "TH": 'Theatre'
    };
    return names[code] || code;
  };

  useEffect(() => {
    fetchCourses();
  }, [department, searchParams]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('department', department);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'limit') {
          queryParams.append(key, filters[key]);
        }
      });
      queryParams.append('limit', filters.limit);

      const response = await authenticatedFetch(`/api/v1/courses?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      
      setCourses(data.courses || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    const newParams = new URLSearchParams();
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k] && k !== 'limit') {
        newParams.set(k, newFilters[k]);
      }
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    
    window.scrollTo(0, 0);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      professor: '',
      term: '',
      level: '',
      page: 1,
      limit: 20
    });
    setSearchParams({});
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Courses</h2>
            <p className="text-red-600">{error}</p>
            <button onClick={() => navigate('/departments')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Back to Departments</button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/departments')} className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Departments
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xl">{department}</div>
              <h1 className="text-3xl font-bold text-gray-900">{getDepartmentName(department)}</h1>
            </div>
            <p className="text-gray-600">{courses.length > 0 ? `${pagination.total || courses.length} courses available` : 'No courses found'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
                <input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Course name or title" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professor</label>
                <input type="text" value={filters.professor} onChange={(e) => handleFilterChange('professor', e.target.value)} placeholder="Professor name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
                <input type="text" value={filters.term} onChange={(e) => handleFilterChange('term', e.target.value)} placeholder="e.g., Fall 2024" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Level</label>
                <select value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All Levels</option>
                  <option value="100">100-level</option>
                  <option value="200">200-level</option>
                  <option value="300">300-level</option>
                  <option value="400">400-level</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Clear All Filters</button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No courses found in this department. Try adjusting your filters.</td></tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.course_id} onClick={() => navigate(`/courses/${course.course_id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-blue-600">{course.course_name}</span></td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-900">{course.course_title}</div></td>
                        <td className="px-6 py-4 text-sm text-gray-900">{course.instructors || 'TBA'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.credits}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{course.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.available} / {course.capacity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">Showing page {pagination.page} of {pagination.totalPages}{pagination.total && ` (${pagination.total} total courses)`}</div>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
};

export default DepartmentCourses;