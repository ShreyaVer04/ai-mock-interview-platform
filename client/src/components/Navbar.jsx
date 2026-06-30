import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-semibold text-gray-900">
          MockInterview<span className="text-indigo-600">AI</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1.5"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
