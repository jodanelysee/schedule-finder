import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [scheduleGrid, setScheduleGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'roster', 'schedule'
  
  // Filters for roster
  const [filters, setFilters] = useState({
    athlete: false,
    honors: false,
    program: ''
  });

  // Fetch course details
  useEffect(() => {
    fetchCourseDetails();
    fetchCourseStudents();
    fetchCourseSchedule();
  }, [id]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/v1/courses/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

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
    if (filters.honors) queryParams.append('honors', 'true');
    if (filters.program) queryParams.append('program', filters.program);

    const url = `http://localhost:3000/api/v1/courses/${id}/students?${queryParams}`;

    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }

    const data = await response.json();
    
    // Data is directly an array of students
    setStudents(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error fetching students:', err);
  }
};

const fetchCourseSchedule = async () => {
  try {
    const url = `http://localhost:3000/api/v1/courses/${id}/schedule`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    const data = await response.json();
    
    // Convert the array of students with courses into a schedule grid format
    if (Array.isArray(data) && data.length > 0) {
      const gridData = convertToScheduleGrid(data);
      setScheduleGrid({ schedule: gridData });
    } else {
      setScheduleGrid(null);
    }
  } catch (err) {
    console.error('Error fetching schedule:', err);
    setScheduleGrid(null);
  }
};

// Helper function to convert API data to schedule grid format
const convertToScheduleGrid = (studentsData) => {
  const grid = {
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {}
  };


  studentsData.forEach(student => {
    const studentName = student.first_name || student.student_id;
    
    if (!student.courses || student.courses.length === 0) {
      console.log('Student has no courses:', student.student_id);
      return;
    }

    student.courses.forEach(course => {
      const day = course.day_of_week;
      
      // Skip if not a weekday
      if (!grid[day]) {
        return;
      }
      
      // Convert time format from "11:40:00" to "11:40"
      const startTime = course.start_time ? course.start_time.substring(0, 5) : null;
      
      if (!startTime) {
        console.log('No start time for course:', course);
        return;
      }
      
      // Initialize the time slot if it doesn't exist
      if (!grid[day][startTime]) {
        grid[day][startTime] = [];
      }
      
      // Add the course to the grid
      grid[day][startTime].push({
        course_name: course.course_name,
        student_name: studentName,
        course_title: course.course_title,
        room: course.room
      });
    });
  });

  return grid;
};

  // Re-fetch students when filters change
  useEffect(() => {
    if (id) {
      fetchCourseStudents();
    }
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Course</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Course not found</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/courses')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.course_name}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{course.course_title}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              course.status === 'Open' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {course.status}
            </span>
          </div>

          {/* Course Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Instructor</p>
              <p className="font-semibold text-gray-900">{course.instructors || 'TBA'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Credits</p>
              <p className="font-semibold text-gray-900">{course.credits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enrollment</p>
              <p className="font-semibold text-gray-900">
                {course.capacity - course.available} / {course.capacity}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Seats</p>
              <p className="font-semibold text-gray-900">{course.available}</p>
            </div>
          </div>

          {/* Meeting Times */}
          {course.meeting_times && course.meeting_times.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Meeting Times</h3>
              <div className="space-y-2">
                {course.meeting_times.map((meeting, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium mr-2">{meeting.days}</span>
                    <span>{meeting.start_time} - {meeting.end_time}</span>
                    {meeting.room && <span className="ml-2 text-gray-500">({meeting.room})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Course Info
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'roster'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Class Roster ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'schedule'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Schedule Grid
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Course Info Tab */}
            {activeTab === 'info' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Course Code</p>
                    <p className="text-gray-900">{course.course_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Course Title</p>
                    <p className="text-gray-900">{course.course_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Term</p>
                    <p className="text-gray-900">{course.term || 'N/A'}</p>
                  </div>
                  {course.description && (
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-900">{course.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Roster Tab */}
{/* Roster Tab */}
{activeTab === 'roster' && (
  <div>
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Class Roster Filters
      </h3>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.athlete}
            onChange={(e) => handleFilterChange('athlete', e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Athletes Only</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.honors}
            onChange={(e) => handleFilterChange('honors', e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Honors Only</span>
        </label>
        <input
          type="text"
          placeholder="Filter by program (e.g., CS.BS)"
          value={filters.program}
          onChange={(e) => handleFilterChange('program', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    {students.length === 0 ? (
      <p className="text-gray-500 text-center py-8">No students enrolled in this course.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Advisors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.student_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.student_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.last_name ? `${student.last_name}, ${student.first_name}` : student.first_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.class_level || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {student.programs || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-col">
                    {student.advisors && (
                      <span className="font-medium">{student.advisors}</span>
                    )}
                    {student.advisor_emails && (
                      <span className="text-xs text-gray-500">{student.advisor_emails}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-wrap gap-1">
                    {student.athlete_flag && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Athlete
                      </span>
                    )}
                    {student.honors_flag && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Honors
                      </span>
                    )}
                    {student.first_gen && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        First-Gen
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => navigate(`/students/${student.student_id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

            {/* Schedule Grid Tab */}
            {activeTab === 'schedule' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Combined Student Schedule Grid
                </h3>
                {scheduleGrid && scheduleGrid.schedule ? (
                  <ScheduleGrid scheduleData={scheduleGrid.schedule} />
                ) : (
                  <p className="text-gray-500 text-center py-8">No schedule data available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Grid Component
const ScheduleGrid = ({ scheduleData }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
              Time
            </th>
            {days.map(day => (
              <th key={day} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time}>
              <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50">
                {time}
              </td>
              {days.map(day => {
                const courses = scheduleData[day]?.[time] || [];
                return (
                  <td key={`${day}-${time}`} className="border border-gray-300 p-1">
                    {courses.length > 0 ? (
                      <div className="space-y-1">
                        {courses.map((course, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-100 border-l-4 border-blue-600 p-2 text-xs rounded"
                          >
                            <div className="font-semibold text-blue-900">{course.course_name}</div>
                            <div className="text-blue-700">{course.student_name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-12"></div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseDetails;