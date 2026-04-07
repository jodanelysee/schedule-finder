import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    // Public routes (no auth required)
    route("/login", "routes/login.jsx"),
    
    // Protected routes (wrap with auth layout)
    layout("./layouts/ProtectedLayout.jsx", [
        index("Home/home.jsx"),
        route("/departments", "Departments/departments.jsx"),
        route("/departments/:department", "Departments/departmentCourses.jsx"),
        route("/courses", "Courses/courses.jsx"),
        route("/courses/:id", "Courses/courseDetails.jsx"),
        route("/students", "Students/students.jsx"),
        route("/students/:id", "Students/studentDetails.jsx"),
    ]),
] satisfies RouteConfig;