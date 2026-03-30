import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'courses', 'schedule'

  // Fetch student details
  useEffect(() => {
    fetchStudentDetails();
    fetchStudentCourses();
    fetchStudentSchedule();
  }, [id]);

  const fetchStudentDetails = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`http://localhost:3000/api/v1/students/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch student details');
    }

    const data = await response.json();
    console.log('Student data:', data);
    console.log('Advisors type:', typeof data.advisors); // DEBUG
    console.log('Advisors value:', data.advisors); // DEBUG
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
      const response = await fetch(`http://localhost:3000/api/v1/students/${id}/courses`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      console.log('Courses data:', data);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchStudentSchedule = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/students/${id}/schedule`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      console.log('Schedule data:', data);
      
      // Convert to schedule grid format
      const gridData = convertToScheduleGrid(data);
      setSchedule(gridData);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  // Convert courses array to schedule grid
  const convertToScheduleGrid = (coursesData) => {
    const grid = {
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {}
    };

    if (!Array.isArray(coursesData)) return grid;

    coursesData.forEach(course => {
      const day = course.day_of_week;
      
      if (!grid[day]) return; // Skip non-weekdays
      
      const startTime = course.start_time ? course.start_time.substring(0, 5) : null;
      
      if (!startTime) return;
      
      if (!grid[day][startTime]) {
        grid[day][startTime] = [];
      }
      
      grid[day][startTime].push({
        course_name: course.course_name,
        course_title: course.course_title,
        room: course.room,
        start_time: startTime,
        end_time: course.end_time ? course.end_time.substring(0, 5) : null
      });
    });

    return grid;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Student</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Student not found</p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Back to Students
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
          onClick={() => navigate('/students')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Students
        </button>

        {/* Student Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {student.last_name ? `${student.last_name}, ${student.first_name}` : student.first_name || 'Unknown'}
              </h1>
              <p className="text-xl text-gray-600 mb-4">Student ID: {student.student_id}</p>
            </div>
            <div className="flex gap-2">
              {student.athlete_flag && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                  Athlete
                </span>
              )}
              {student.honors_flag && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold text-sm">
                  Honors
                </span>
              )}
              {student.first_gen && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                  First-Gen
                </span>
              )}
            </div>
          </div>

          {/* Student Info Grid */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
  <div>
    <p className="text-sm text-gray-500">Class Level</p>
    <p className="font-semibold text-gray-900">
      {student.class_level === '01' && 'Freshman'}
      {student.class_level === '02' && 'Sophomore'}
      {student.class_level === '03' && 'Junior'}
      {student.class_level === '04' && 'Senior'}
      {!['01', '02', '03', '04'].includes(student.class_level) && (student.class_level || 'N/A')}
    </p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Programs</p>
    <p className="font-semibold text-gray-900">
      {Array.isArray(student.programs) 
        ? student.programs.map(p => p.program_code || p).join(', ')
        : student.programs || 'N/A'
      }
    </p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Completed Credits</p>
    <p className="font-semibold text-gray-900">{student.completed_credits_ug || '0'}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Enrolled Courses</p>
    <p className="font-semibold text-gray-900">{courses.length}</p>
  </div>
</div>

          {/* Advisors Section - IMPORTANT! */}
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
            {advisor.email && (
              <a 
                href={`mailto:${advisor.email}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {advisor.email}
              </a>
            )}
          </div>
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
                Student Info
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'courses'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Enrolled Courses ({courses.length})
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'schedule'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Weekly Schedule
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Student Info Tab */}
            {activeTab === 'info' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="text-gray-900 font-medium">{student.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-gray-900 font-medium">
                      {student.first_name} {student.last_name || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class Level</p>
                    <p className="text-gray-900 font-medium">
                      {student.class_level === '01' && 'Freshman (01)'}
                      {student.class_level === '02' && 'Sophomore (02)'}
                      {student.class_level === '03' && 'Junior (03)'}
                      {student.class_level === '04' && 'Senior (04)'}
                    </p>
                  </div>
                  <div>
  <p className="text-sm text-gray-500">Programs/Majors</p>
  <p className="text-gray-900 font-medium">
    {Array.isArray(student.programs) 
      ? student.programs.map(p => p.program_code || p).join(', ')
      : student.programs || 'N/A'
    }
  </p>
</div>
                  <div>
                    <p className="text-sm text-gray-500">Completed Credits</p>
                    <p className="text-gray-900 font-medium">{student.completed_credits_ug || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Special Flags</p>
                    <div className="flex gap-2 mt-1">
                      {student.athlete_flag && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Athlete</span>
                      )}
                      {student.honors_flag && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Honors</span>
                      )}
                      {student.first_gen && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">First-Gen</span>
                      )}
                      {!student.athlete_flag && !student.honors_flag && !student.first_gen && (
                        <span className="text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Enrolled Courses
                </h3>
                {courses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No courses enrolled.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Meeting Times
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Room
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map((course, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {course.course_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {course.course_title}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {course.day_of_week && course.start_time && course.end_time ? (
                                <div>
                                  {course.day_of_week} {course.start_time.substring(0, 5)} - {course.end_time.substring(0, 5)}
                                </div>
                              ) : (
                                'TBA'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {course.room || 'TBA'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => navigate(`/courses/${course.course_id}`)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Course
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
                  Weekly Schedule
                </h3>
                {schedule ? (
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
            <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100">
              Time
            </th>
            {days.map(day => (
              <th key={day} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 min-w-[200px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time}>
              <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 sticky left-0">
                {time}
              </td>
              {days.map(day => {
                const courses = scheduleData[day]?.[time] || [];
                return (
                  <td key={`${day}-${time}`} className="border border-gray-300 p-1 align-top">
                    {courses.length > 0 ? (
                      <div className="space-y-1">
                        {courses.map((course, idx) => (
                          <div
                            key={idx}
                            className="bg-green-100 border-l-4 border-green-600 p-2 text-xs rounded"
                          >
                            <div className="font-semibold text-green-900">{course.course_name}</div>
                            <div className="text-green-700">{course.course_title}</div>
                            {course.room && (
                              <div className="text-green-600 text-xs">{course.room}</div>
                            )}
                            {course.end_time && (
                              <div className="text-green-600 text-xs">Until {course.end_time}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-16"></div>
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

export default StudentDetails;