import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function meta() {
  return [
    { title: 'Login - Student Schedule Finder' },
    { name: 'description', content: 'Faculty and advisor login portal' },
  ];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check if redirected due to timeout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('timeout') === 'true') {
      setTimeoutMessage(true);
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  // Validate email format
  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., name@domain.com)';
    }
    return '';
  };

  // Validate password is not empty
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    return '';
  };

  // Validate both fields
  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    const newErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field blur (mark as touched)
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (field === 'email') {
      const error = validateEmail(email);
      setErrors(prev => ({ ...prev, email: error }));
    } else if (field === 'password') {
      const error = validatePassword(password);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  // Handle email change
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Real-time validation for email format
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Real-time validation for password
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate before submission
    if (!validateForm()) {
      return;
    }
    
    setServerError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      // Show generic error message (don't reveal if email exists or password is wrong)
      setServerError('Invalid email or password. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faculty/Advisor Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the student scheduling system
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Session timeout message */}
          {timeoutMessage && (
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="text-sm text-yellow-800">
                Your session has expired due to inactivity. Please login again.
              </div>
            </div>
          )}
          
          {/* Server error (generic) */}
          {serverError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{serverError}</div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email && touched.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="name@example.com"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password && touched.password
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          <div className="text-sm text-center text-gray-500 border-t pt-4">
            <p className="font-semibold">Demo Credentials:</p>
            <p className="mt-1">Email: test@example.com</p>
            <p>Password: Test123!</p>
            <p className="mt-2 text-xs text-gray-400">Session timeout: 15 minutes of inactivity</p>
          </div>
        </form>
      </div>
    </div>
  );
}