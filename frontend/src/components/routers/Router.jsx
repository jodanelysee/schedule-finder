import React from 'react';
import {
    createBrowserRouter, 
} from "react-router";
import App from '../../App';
import Home from '../Home';
import Departments from '../departments/Departments';
import Courses from '../courses/Courses';
import Students from '../students/Students';
import CourseDetails from '../courses/CourseDetails';
import StudentDetails from '../students/StudentDetails';
import DepartmentCourses from '../departments/DepartmentCourses';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children: [
      // HOME PAGE
      {
        path: "/",
        element: <Home/>
      }, 
      // DEPARTMENTS
      {
        path: "/departments",
        element: <Departments/>
      },
      {
        path: "/departments/:department",
        element: <DepartmentCourses/>
      },
      // COURSES
      {
        path: "/courses",
        element: <Courses/>
      },
      {
        path: "/courses/:id",
        element: <CourseDetails/>
      },  
      // STUDENTS
      {
        path: "/students",
        element: <Students/>
      },
      {
        path: "/students/:id",
        element: <StudentDetails/>
      }
    ]
  }
]);

export default router;