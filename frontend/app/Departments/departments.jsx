import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';

const Departments = () => {
  const { authenticatedFetch } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch('/api/v1/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      const deptArray = Array.isArray(data) ? data : data.departments || [];
      setDepartments(deptArray);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const deptCode = typeof dept === 'string' ? dept : dept.department;
    return deptCode.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getDepartmentColor = (index) => {
    const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-yellow-500 to-yellow-600', 'from-red-500 to-red-600', 'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600', 'from-orange-500 to-orange-600', 'from-cyan-500 to-cyan-600'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading departments...</p>
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
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Departments</h2>
            <p className="text-red-600">{error}</p>
            <button onClick={fetchDepartments} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Try Again</button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Departments</h1>
            <p className="text-gray-600">Browse courses by department ({departments.length} departments)</p>
          </div>

          <div className="mb-8">
            <div className="max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Search Departments</label>
              <div className="relative">
                <input type="text" id="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by department code (e.g., CS, MA, EN)" className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No departments found</h3>
              <p className="mt-2 text-gray-600">Try adjusting your search query.</p>
              <button onClick={() => setSearchQuery('')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Clear Search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDepartments.map((dept, index) => {
                const deptCode = typeof dept === 'string' ? dept : dept.department;
                const deptName = getDepartmentName(deptCode);
                return (
                  <div key={deptCode} onClick={() => navigate(`/departments/${deptCode}`)} className="group cursor-pointer transform transition-all duration-200 hover:scale-105">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                      <div className={`h-32 bg-gradient-to-br ${getDepartmentColor(index)} flex items-center justify-center`}>
                        <div className="text-center">
                          <h2 className="text-4xl font-bold text-white mb-2">{deptCode}</h2>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{deptName}</h3>
                        <p className="text-sm text-gray-500 mt-1">View all courses →</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
};

export default Departments;