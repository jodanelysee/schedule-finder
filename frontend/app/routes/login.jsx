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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check if redirected due to timeout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('timeout') === 'true') {
      setTimeoutMessage(true);
      // Remove the parameter from URL
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeoutMessage(false);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
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
          {timeoutMessage && (
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="text-sm text-yellow-800">
                Your session has expired due to inactivity. Please login again.
              </div>
            </div>
          )}
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-sm text-center text-gray-500 border-t pt-4">
            <p className="font-semibold">Demo Credentials:</p>
            <p className="mt-1">Email: test@example.com</p>
            <p>Password: Test123!</p>
          </div>
        </form>
      </div>
    </div>
  );
}