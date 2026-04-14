import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';

const Students = () => {
  const { authenticatedFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    athlete: searchParams.get('athlete') === 'true',
    honors: searchParams.get('honors') === 'true',
    first_gen: searchParams.get('first_gen') === 'true',
    program: searchParams.get('program') || '',
    graduating: searchParams.get('graduating') || '',
    level: searchParams.get('level') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });

  useEffect(() => {
    fetchStudents();
  }, [searchParams]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== false) {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await authenticatedFetch(`/api/v1/students?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      
      let studentsArray = [];
      let paginationData = {};
      
      if (data.students && data.pagination) {
        studentsArray = data.students;
        paginationData = data.pagination;
      } else if (Array.isArray(data)) {
        studentsArray = data;
        paginationData = { page: filters.page, totalPages: Math.ceil(data.length / filters.limit), total: data.length, limit: filters.limit };
      } else {
        studentsArray = [];
        paginationData = { page: 1, totalPages: 1, total: 0 };
      }
      
      setStudents(studentsArray);
      setPagination(paginationData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    const newParams = new URLSearchParams();
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k] && newFilters[k] !== false && k !== 'limit') {
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
      athlete: false,
      honors: false,
      first_gen: false,
      program: '',
      graduating: '',
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
            <button onClick={fetchStudents} className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">Try again</button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Students</h1>
            <p className="text-gray-600">{pagination.total ? `${pagination.total} students total` : 'Loading students...'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by ID or Name</label>
                <input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Student ID or name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <input type="text" value={filters.program} onChange={(e) => handleFilterChange('program', e.target.value)} placeholder="e.g., CS.BS" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Graduating Year</label>
                <input type="text" value={filters.graduating} onChange={(e) => handleFilterChange('graduating', e.target.value)} placeholder="e.g., 2025" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              <label className="flex items-center">
                <input type="checkbox" checked={filters.athlete} onChange={(e) => handleFilterChange('athlete', e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Athletes Only</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked={filters.honors} onChange={(e) => handleFilterChange('honors', e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Honors Only</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked={filters.first_gen} onChange={(e) => handleFilterChange('first_gen', e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">First-Gen Only</span>
              </label>
              <button onClick={clearFilters} className="ml-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Clear All Filters</button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advisors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No students found. Try adjusting your filters.</td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.student_id} onClick={() => navigate(`/students/${student.student_id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.last_name ? `${student.last_name}, ${student.first_name}` : student.first_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.class_level === '01' && 'Freshman'}
                          {student.class_level === '02' && 'Sophomore'}
                          {student.class_level === '03' && 'Junior'}
                          {student.class_level === '04' && 'Senior'}
                          {!['01', '02', '03', '04'].includes(student.class_level) && student.class_level}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{Array.isArray(student.programs) ? student.programs.map(p => p.program_code || p).join(', ') : student.programs || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{Array.isArray(student.advisors) ? student.advisors.map(a => a.name).join(', ') : student.advisors || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-1">
                            {student.athlete_flag && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Athlete</span>}
                            {student.honors_flag && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Honors</span>}
                            {student.first_gen && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">First-Gen</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/students/${student.student_id}`); }} className="text-blue-600 hover:text-blue-800 font-medium">View Details</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">Showing page {pagination.page || 1} of {pagination.totalPages || 1}{pagination.total && ` (${pagination.total} total students)`}</div>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange((pagination.page || 1) - 1)} disabled={!pagination.page || pagination.page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => handlePageChange((pagination.page || 1) + 1)} disabled={!pagination.totalPages || pagination.page === pagination.totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
};

export default Students;