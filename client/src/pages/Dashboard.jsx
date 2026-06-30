import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createSession, listSessions } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await listSessions();
      setSessions(res.data.sessions);
    } catch (err) {
      setError('Failed to load your past sessions.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await createSession();
      navigate(`/interview/${res.data.session.id}`);
    } catch (err) {
      setError('Failed to start a new interview. Please try again.');
      setStarting(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero / start interview card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Practice a behavioral interview
          </h1>
          <p className="text-gray-500 mb-6 max-w-xl">
            You'll have a live voice conversation with an AI interviewer for{' '}
            <span className="font-medium text-gray-700">{user?.jobRole}</span>. It listens, asks
            follow-ups, and adapts based on what you actually say.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleStartInterview}
            disabled={starting}
            className="bg-indigo-600 text-white rounded-md px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {starting ? 'Starting...' : 'Start Behavioral Interview'}
          </button>
        </div>

        {/* Session history */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your past sessions</h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No interviews yet. Start your first one above.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Behavioral Interview{' '}
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(s.startedAt)} · {s._count?.messages || 0} messages
                    {s.feedback?.overallScore && (
                      <> · Score: {s.feedback.overallScore}/10</>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  {s.status === 'active' ? (
                    <button
                      onClick={() => navigate(`/interview/${s.id}`)}
                      className="text-sm text-indigo-600 font-medium border border-indigo-200 rounded-md px-3 py-1.5 hover:bg-indigo-50"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/feedback/${s.id}`)}
                      className="text-sm text-gray-700 font-medium border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
                    >
                      View Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
