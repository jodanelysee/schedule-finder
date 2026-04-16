import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';

const StudentDetails = () => {
  const { authenticatedFetch } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchStudentDetails();
    fetchStudentCourses();
    fetchStudentSchedule();
  }, [id]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/v1/students/${id}`);
      if (!response.ok) throw new Error('Failed to fetch student details');
      const data = await response.json();
      setStudent(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCourses = async () => {
    try {
      const response = await authenticatedFetch(`/api/v1/students/${id}/courses`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchStudentSchedule = async () => {
    try {
      const response = await authenticatedFetch(`/api/v1/students/${id}/schedule`);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      const data = await response.json();
      console.log('Schedule data received:', data);
      setSchedule(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setSchedule([]);
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading student details...</p>
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
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Student</h2>
            <p className="text-red-600">{error}</p>
            <button onClick={() => navigate('/students')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Back to Students</button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (!student) {
    return (
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">Student not found</p>
            <button onClick={() => navigate('/students')} className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">Back to Students</button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/students')} className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Students
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.last_name ? `${student.last_name}, ${student.first_name}` : student.first_name || 'Unknown'}</h1>
                <p className="text-xl text-gray-600 mb-4">Student ID: {student.student_id}</p>
              </div>
              <div className="flex gap-2">
                {student.athlete_flag && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">Athlete</span>}
                {student.honors_flag && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold text-sm">Honors</span>}
                {student.first_gen && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold text-sm">First-Gen</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div><p className="text-sm text-gray-500">Class Level</p><p className="font-semibold text-gray-900">
                {student.class_level === '01' && 'Freshman'}
                {student.class_level === '02' && 'Sophomore'}
                {student.class_level === '03' && 'Junior'}
                {student.class_level === '04' && 'Senior'}
                {!['01', '02', '03', '04'].includes(student.class_level) && (student.class_level || 'N/A')}
              </p></div>
              <div><p className="text-sm text-gray-500">Programs</p><p className="font-semibold text-gray-900">
                {Array.isArray(student.programs) ? student.programs.map(p => p.program_code || p).join(', ') : student.programs || 'N/A'}
              </p></div>
              <div><p className="text-sm text-gray-500">Completed Credits</p><p className="font-semibold text-gray-900">{student.completed_credits_ug || '0'}</p></div>
              <div><p className="text-sm text-gray-500">Enrolled Courses</p><p className="font-semibold text-gray-900">{courses.length}</p></div>
            </div>

            {student.advisors && student.advisors.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Academic Advisors</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  {student.advisors.map((advisor, index) => (
                    <div key={index} className="flex items-center mb-2 last:mb-0">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900">{advisor.name}</p>
                        {advisor.email && <a href={`mailto:${advisor.email}`} className="text-sm text-blue-600 hover:text-blue-800">{advisor.email}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button onClick={() => setActiveTab('info')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Student Info</button>
                <button onClick={() => setActiveTab('courses')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Enrolled Courses ({courses.length})</button>
                <button onClick={() => setActiveTab('schedule')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Weekly Schedule</button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><p className="text-sm text-gray-500">Student ID</p><p className="text-gray-900 font-medium">{student.student_id}</p></div>
                    <div><p className="text-sm text-gray-500">Name</p><p className="text-gray-900 font-medium">{student.first_name} {student.last_name || ''}</p></div>
                    <div><p className="text-sm text-gray-500">Class Level</p><p className="text-gray-900 font-medium">
                      {student.class_level === '01' && 'Freshman (01)'}
                      {student.class_level === '02' && 'Sophomore (02)'}
                      {student.class_level === '03' && 'Junior (03)'}
                      {student.class_level === '04' && 'Senior (04)'}
                    </p></div>
                    <div><p className="text-sm text-gray-500">Programs/Majors</p><p className="text-gray-900 font-medium">
                      {Array.isArray(student.programs) ? student.programs.map(p => p.program_code || p).join(', ') : student.programs || 'N/A'}
                    </p></div>
                    <div><p className="text-sm text-gray-500">Completed Credits</p><p className="text-gray-900 font-medium">{student.completed_credits_ug || '0'}</p></div>
                    <div><p className="text-sm text-gray-500">Special Flags</p><div className="flex gap-2 mt-1">
                      {student.athlete_flag && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Athlete</span>}
                      {student.honors_flag && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Honors</span>}
                      {student.first_gen && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">First-Gen</span>}
                      {!student.athlete_flag && !student.honors_flag && !student.first_gen && <span className="text-gray-500">None</span>}
                    </div></div>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Courses</h3>
                  {courses.length === 0 ? <p className="text-gray-500 text-center py-8">No courses enrolled.</p> : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Times</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {courses.map((course, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{course.course_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{course.course_title}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {course.meetings && course.meetings.length > 0 ? (
                                  <div>
                                    {course.meetings.map((meeting, idx) => (
                                      <div key={idx}>
                                        {meeting.day_of_week} {meeting.start_time?.substring(0,5)} - {meeting.end_time?.substring(0,5)}
                                        {idx < course.meetings.length - 1 && <br />}
                                      </div>
                                    ))}
                                  </div>
                                ) : 'TBA'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {course.meetings && course.meetings.length > 0 ? (
                                  <div>
                                    {course.meetings.map((meeting, idx) => (
                                      <div key={idx}>
                                        {meeting.room || 'TBA'}
                                        {idx < course.meetings.length - 1 && <br />}
                                      </div>
                                    ))}
                                  </div>
                                ) : 'TBA'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button onClick={() => navigate(`/courses/${course.course_id}`)} className="text-blue-600 hover:text-blue-800 font-medium">View Course</button>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                  {schedule && schedule.length > 0 ? (
                    <ScheduleGrid scheduleData={schedule} />
                  ) : (
                    <p className="text-gray-500 text-center py-8">No schedule data available.</p>
                  )}
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

/** Convert "HH:MM" to total minutes since midnight */
const toMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
  return h * 60 + m;
};

/**
 * The full visible time range we render.
 * Adjust DAY_START / DAY_END to widen/shrink the grid.
 */
const DAY_START = 8 * 60 + 0;   // 08:00
const DAY_END   = 21 * 60 + 30; // 21:30
const TOTAL_MINS = DAY_END - DAY_START;

/** px per minute — controls overall grid height */
const PX_PER_MIN = 1.4;

/** Hour labels shown on the left axis */
const HOUR_LABELS = Array.from({ length: Math.ceil(TOTAL_MINS / 60) + 1 }, (_, i) => {
  const totalMin = DAY_START + i * 60;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > Math.floor(DAY_END / 60)) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}).filter(Boolean);

// ─── ScheduleGrid (student view) ────────────────────────────────────────────

const ScheduleGrid = ({ scheduleData }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Group meetings by day
  const byDay = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
  scheduleData.forEach(meeting => {
    const day = meeting.day_of_week;
    if (!byDay[day]) return;
    const startMin = toMinutes(meeting.start_time);
    const endMin   = toMinutes(meeting.end_time);
    if (startMin === null) return;
    byDay[day].push({
      course_name:  meeting.course_name,
      course_title: meeting.course_title,
      room:         meeting.room,
      startMin,
      endMin: endMin ?? startMin + 75, // fallback 75-min class
    });
  });

  const gridHeight = TOTAL_MINS * PX_PER_MIN;

  return (
    <div className="overflow-x-auto">
      <div className="flex" style={{ minWidth: 700 }}>

        {/* Time axis */}
        <div className="flex-shrink-0 w-16 relative" style={{ height: gridHeight + 32 }}>
          {/* header spacer */}
          <div className="h-8" />
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

        {/* Day columns */}
        {days.map(day => (
          <div key={day} className="flex-1 min-w-[140px]">
            {/* Day header */}
            <div className="h-8 flex items-center justify-center text-sm font-semibold text-gray-700 border-b border-gray-200 bg-gray-50">
              {day}
            </div>

            {/* Column body */}
            <div
              className="relative border-l border-gray-200"
              style={{ height: gridHeight }}
            >
              {/* Hour grid lines */}
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

              {/* Course blocks */}
              {byDay[day].map((course, idx) => {
                const top    = (course.startMin - DAY_START) * PX_PER_MIN;
                const height = (course.endMin - course.startMin) * PX_PER_MIN;
                return (
                  <div
                    key={idx}
                    className="absolute left-1 right-1 bg-green-100 border-l-4 border-green-500 rounded shadow-sm overflow-hidden px-2 py-1"
                    style={{ top, height, minHeight: 24 }}
                    title={`${course.course_name} — ${course.course_title}${course.room ? ` (${course.room})` : ''}`}
                  >
                    <div className="text-xs font-semibold text-green-900 truncate leading-tight">
                      {course.course_name}
                    </div>
                    {height > 32 && (
                      <div className="text-xs text-green-700 truncate leading-tight">
                        {course.course_title}
                      </div>
                    )}
                    {height > 48 && course.room && (
                      <div className="text-xs text-green-600 truncate leading-tight">
                        {course.room}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDetails;
