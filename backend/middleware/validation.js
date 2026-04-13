const { body, param, query, validationResult } = require('express-validator');

// ============ HELPER FUNCTION ============
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ============ AUTH VALIDATION ============
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail() // Sanitizes email (converts to lowercase, removes dots in Gmail, etc.)
    .trim()
    .escape(), // Escapes HTML characters
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .trim(),
  handleValidationErrors
];

// ============ COURSE VALIDATION ============
const validateCourseSearch = [
  query('search')
    .optional()
    .isString().withMessage('Search must be text')
    .isLength({ max: 200 }).withMessage('Search too long')
    .trim()
    .escape(),
  query('department')
    .optional()
    .matches(/^[A-Z]{2,4}$/).withMessage('Department must be 2-4 uppercase letters (e.g., CS, MATH)')
    .trim()
    .toUpperCase(), // Sanitizes to uppercase
  query('professor')
    .optional()
    .isString().withMessage('Professor name must be text')
    .isLength({ max: 100 }).withMessage('Professor name too long')
    .trim()
    .escape(),
  query('status')
    .optional()
    .isIn(['Open', 'Clsd', '']).withMessage('Status must be Open or Clsd')
    .trim(),
  query('term')
    .optional()
    .matches(/^\d{2}\/(SP|FA|SU)$/).withMessage('Term must be format: YY/SP, YY/FA, YY/SU')
    .trim()
    .toUpperCase(),
  query('level')
    .optional()
    .isIn(['undergraduate', 'graduate', '']).withMessage('Level must be undergraduate or graduate'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be between 1 and 1000')
    .toInt(), // Converts string to integer
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
];

const validateCourseId = [
  param('id')
    .isInt({ min: 1 }).withMessage('Course ID must be a positive integer')
    .toInt(),
  handleValidationErrors
];

// ============ STUDENT VALIDATION ============
const validateStudentSearch = [
  query('search')
    .optional()
    .isString().withMessage('Search must be text')
    .isLength({ max: 100 }).withMessage('Search too long')
    .trim()
    .escape(),
  query('student_id')
    .optional()
    .matches(/^\d{7}$/).withMessage('Student ID must be 7 digits')
    .trim(),
  query('program')
    .optional()
    .matches(/^[A-Z]{2,4}\.[A-Z]{2,4}$/).withMessage('Program must be format: CS.BS, SE.MS, etc.')
    .trim()
    .toUpperCase(),
  query('athlete')
    .optional()
    .isBoolean().withMessage('Athlete must be true or false')
    .toBoolean(),
  query('honors')
    .optional()
    .isBoolean().withMessage('Honors must be true or false')
    .toBoolean(),
  query('first_gen')
    .optional()
    .isBoolean().withMessage('First-gen must be true or false')
    .toBoolean(),
  query('graduating')
    .optional()
    .isInt({ min: 2024, max: 2030 }).withMessage('Graduating year must be between 2024 and 2030')
    .toInt(),
  query('level')
    .optional()
    .isIn(['undergraduate', 'graduate', '']).withMessage('Level must be undergraduate or graduate'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be between 1 and 1000')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
];

const validateStudentId = [
  param('id')
    .matches(/^\d{7}$/).withMessage('Student ID must be 7 digits')
    .trim(),
  handleValidationErrors
];

// ============ USER PROFILE VALIDATION ============
const validateUserUpdate = [
  body('first_name')
    .optional()
    .isString().withMessage('First name must be text')
    .isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters')
    .trim()
    .escape(),
  body('last_name')
    .optional()
    .isString().withMessage('Last name must be text')
    .isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters')
    .trim()
    .escape(),
  body('email')
    .optional()
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail()
    .trim()
    .escape(),
  body('department')
    .optional()
    .isString().withMessage('Department must be text')
    .isLength({ max: 100 }).withMessage('Department name too long')
    .trim()
    .escape(),
  handleValidationErrors
];

// ============ ENROLLMENT VALIDATION ============
const validateEnrollment = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .matches(/^\d{7}$/).withMessage('Student ID must be 7 digits')
    .trim(),
  body('course_id')
    .notEmpty().withMessage('Course ID is required')
    .isInt({ min: 1 }).withMessage('Course ID must be a positive integer')
    .toInt(),
  body('term')
    .optional()
    .matches(/^\d{2}\/(SP|FA|SU)$/).withMessage('Term must be format: YY/SP, YY/FA, YY/SU')
    .trim()
    .toUpperCase(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateCourseSearch,
  validateCourseId,
  validateStudentSearch,
  validateStudentId,
  validateUserUpdate,
  validateEnrollment
};