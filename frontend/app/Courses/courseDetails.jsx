import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';

const CourseDetails = () => {
  const { authenticatedFetch } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [scheduleGrid, setScheduleGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [filters, setFilters] = useState({
    athlete: false,
    honors: false,
    program: ''
  });

  useEffect(() => {
    fetchCourseDetails();
    fetchCourseStudents();
    fetchCourseSchedule();
  }, [id]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/v1/courses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch course details');
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.athlete) queryParams.append('athlete', 'true');
      if (filters.honors)  queryParams.append('honors', 'true');
      if (filters.program) queryParams.append('program', filters.program);

      const response = await authenticatedFetch(`/api/v1/courses/${id}/students?${queryParams}`);
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchCourseSchedule = async () => {
    try {
      const response = await authenticatedFetch(`/api/v1/courses/${id}/schedule`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setScheduleGrid({ raw: data });
      } else {
        setScheduleGrid(null);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setScheduleGrid(null);
    }
  };

  useEffect(() => {
    if (id) fetchCourseStudents();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading course details...</p>
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
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Course</h2>
            <p className="text-red-600">{error}</p>
            <button onClick={() => navigate('/courses')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              Back to Courses
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (!course) {
    return (
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">Course not found</p>
            <button onClick={() => navigate('/courses')} className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
              Back to Courses
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/courses')} className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Courses
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.course_name}</h1>
                <p className="text-xl text-gray-600 mb-4">{course.course_title}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                course.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {course.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div><p className="text-sm text-gray-500">Instructor</p><p className="font-semibold text-gray-900">{course.instructors || 'TBA'}</p></div>
              <div><p className="text-sm text-gray-500">Credits</p><p className="font-semibold text-gray-900">{course.credits}</p></div>
              <div><p className="text-sm text-gray-500">Enrollment</p><p className="font-semibold text-gray-900">{course.capacity - course.available} / {course.capacity}</p></div>
              <div><p className="text-sm text-gray-500">Available Seats</p><p className="font-semibold text-gray-900">{course.available}</p></div>
            </div>

            {course.meetings && course.meetings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Meeting Times</h3>
                <div className="space-y-2">
                  {course.meetings.map((meeting, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium mr-2">{meeting.day_of_week}</span>
                      <span>{meeting.start_time?.substring(0,5)} - {meeting.end_time?.substring(0,5)}</span>
                      {meeting.room && <span className="ml-2 text-gray-500">({meeting.room})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button onClick={() => setActiveTab('info')} className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>Course Info</button>
                <button onClick={() => setActiveTab('roster')} className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'roster' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>Class Roster ({students.length})</button>
                <button onClick={() => setActiveTab('schedule')} className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>Schedule Grid</button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                  <div className="space-y-4">
                    <div><p className="text-sm text-gray-500">Course Code</p><p className="text-gray-900">{course.course_name}</p></div>
                    <div><p className="text-sm text-gray-500">Course Title</p><p className="text-gray-900">{course.course_title}</p></div>
                    <div><p className="text-sm text-gray-500">Term</p><p className="text-gray-900">{course.term || 'N/A'}</p></div>
                    {course.comments && <div><p className="text-sm text-gray-500">Comments</p><p className="text-gray-900">{course.comments}</p></div>}
                  </div>
                </div>
              )}

              {activeTab === 'roster' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Roster Filters</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center">
                        <input type="checkbox" checked={filters.athlete} onChange={(e) => handleFilterChange('athlete', e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Athletes Only</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={filters.honors} onChange={(e) => handleFilterChange('honors', e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Honors Only</span>
                      </label>
                      <input type="text" placeholder="Filter by program (e.g., CS.BS)" value={filters.program} onChange={(e) => handleFilterChange('program', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                  </div>

                  {students.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No students enrolled in this course.</p>
                  ) : (
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
                          {students.map((student) => (
                            <tr key={student.student_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.last_name ? `${student.last_name}, ${student.first_name}` : student.first_name || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.class_level || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{student.programs || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="flex flex-col">
                                  {student.advisors && <span className="font-medium">{student.advisors}</span>}
                                  {student.advisor_emails && <span className="text-xs text-gray-500">{student.advisor_emails}</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {student.athlete_flag && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Athlete</span>}
                                  {student.honors_flag && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Honors</span>}
                                  {student.first_gen && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">First-Gen</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button onClick={() => navigate(`/students/${student.student_id}`)} className="text-blue-600 hover:text-blue-800 font-medium">View Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schedule' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Combined Student Schedule Grid</h3>
                  {scheduleGrid && scheduleGrid.raw
                    ? <CourseScheduleGrid studentsData={scheduleGrid.raw} />
                    : <p className="text-gray-500 text-center py-8">No schedule data available.</p>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
};

// ─── helpers ────────────────────────────────────────────────────────────────

const toMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const DAY_START  = 8 * 60 + 0;
const DAY_END    = 21 * 60 + 30;
const TOTAL_MINS = DAY_END - DAY_START;
const PX_PER_MIN = 1.4;

const HOUR_LABELS = Array.from({ length: Math.ceil(TOTAL_MINS / 60) + 1 }, (_, i) => {
  const totalMin = DAY_START + i * 60;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > Math.floor(DAY_END / 60)) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}).filter(Boolean);

/** Palette of distinct colors for different students */
const STUDENT_COLORS = [
  { bg: 'bg-blue-100',   border: 'border-blue-500',   title: 'text-blue-900',   sub: 'text-blue-700' },
  { bg: 'bg-purple-100', border: 'border-purple-500', title: 'text-purple-900', sub: 'text-purple-700' },
  { bg: 'bg-orange-100', border: 'border-orange-500', title: 'text-orange-900', sub: 'text-orange-700' },
  { bg: 'bg-pink-100',   border: 'border-pink-500',   title: 'text-pink-900',   sub: 'text-pink-700' },
  { bg: 'bg-teal-100',   border: 'border-teal-500',   title: 'text-teal-900',   sub: 'text-teal-700' },
  { bg: 'bg-yellow-100', border: 'border-yellow-500', title: 'text-yellow-900', sub: 'text-yellow-700' },
];

// ─── CourseScheduleGrid ──────────────────────────────────────────────────────
/**
 * Shows each student as a named column within each day.
 * When multiple students share the same time slot the columns sit side-by-side
 * and the whole grid scrolls horizontally.
 *
 * studentsData shape:  Array<{ first_name, student_id, courses: [{ day_of_week, course_name, course_title, start_time, end_time, room }] }>
 */
const CourseScheduleGrid = ({ studentsData }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Build student list + assign colors
  const studentList = studentsData.map((s, i) => ({
    id:    s.student_id,
    name:  s.first_name || s.student_id,
    color: STUDENT_COLORS[i % STUDENT_COLORS.length],
  }));

  // Index events:  byDay[day][studentId] = [{ ...event }]
  const byDay = {};
  days.forEach(d => { byDay[d] = {}; });

  studentsData.forEach(student => {
    const sid = student.student_id;
    if (!student.courses) return;
    student.courses.forEach(course => {
      const day = course.day_of_week;
      if (!byDay[day]) return;
      if (!byDay[day][sid]) byDay[day][sid] = [];
      const startMin = toMinutes(course.start_time);
      const endMin   = toMinutes(course.end_time);
      if (startMin === null) return;
      byDay[day][sid].push({
        course_name:  course.course_name,
        course_title: course.course_title,
        room:         course.room,
        startMin,
        endMin: endMin ?? startMin + 75,
      });
    });
  });

  const gridHeight  = TOTAL_MINS * PX_PER_MIN;
  // Each student sub-column width (px) — narrower so many fit without scrolling too far
  const COL_WIDTH   = 110;

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      {studentList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {studentList.map(s => (
            <div key={s.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${s.color.bg} ${s.color.title}`}>
              <div className={`w-2 h-2 rounded-full border-2 ${s.color.border}`} />
              {s.name}
            </div>
          ))}
        </div>
      )}

      <div className="flex" style={{ minWidth: 80 + days.length * studentList.length * COL_WIDTH }}>

        {/* Time axis */}
        <div className="flex-shrink-0 w-16 relative" style={{ height: gridHeight + 48 }}>
          <div className="h-12" />
          <div className="relative" style={{ height: gridHeight }}>
            {HOUR_LABELS.map(label => {
              const top = (toMinutes(label) - DAY_START) * PX_PER_MIN;
              return (
                <div
                  key={label}
                  className="absolute right-2 text-xs text-gray-400 leading-none"
                  style={{ top: top - 6 }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day groups */}
        {days.map(day => (
          <div key={day} className="border-l border-gray-200" style={{ width: studentList.length * COL_WIDTH }}>
            {/* Day header */}
            <div className="h-8 flex items-center justify-center text-sm font-semibold text-gray-700 border-b border-gray-200 bg-gray-50">
              {day}
            </div>

            {/* Student columns */}
            <div className="flex relative" style={{ height: gridHeight }}>
              {/* Hour grid lines — drawn once behind all columns */}
              <div className="absolute inset-0 pointer-events-none">
                {HOUR_LABELS.map(label => {
                  const top = (toMinutes(label) - DAY_START) * PX_PER_MIN;
                  return (
                    <div
                      key={label}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top }}
                    />
                  );
                })}
              </div>

              {studentList.map(s => (
                <div
                  key={s.id}
                  className="relative border-r border-gray-100"
                  style={{ width: COL_WIDTH, height: gridHeight, flexShrink: 0 }}
                >
                  {(byDay[day][s.id] || []).map((course, idx) => {
                    const top    = (course.startMin - DAY_START) * PX_PER_MIN;
                    const height = (course.endMin - course.startMin) * PX_PER_MIN;
                    return (
                      <div
                        key={idx}
                        className={`absolute left-1 right-1 border-l-4 rounded shadow-sm overflow-hidden px-1.5 py-1 ${s.color.bg} ${s.color.border}`}
                        style={{ top, height, minHeight: 22 }}
                        title={`${s.name}: ${course.course_name} — ${course.course_title}${course.room ? ` (${course.room})` : ''}`}
                      >
                        <div className={`text-xs font-semibold truncate leading-tight ${s.color.title}`}>
                          {course.course_name}
                        </div>
                        {height > 30 && (
                          <div className={`text-xs truncate leading-tight ${s.color.sub}`}>
                            {course.course_title}
                          </div>
                        )}
                        {height > 46 && course.room && (
                          <div className={`text-xs truncate leading-tight ${s.color.sub}`}>
                            {course.room}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseDetails;
