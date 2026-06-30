import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { generateFeedback, getFeedback } from '../api';

export default function Feedback() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeedback();
  }, [sessionId]);

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getFeedback(sessionId);
      setFeedback(res.data.feedback);
    } catch (err) {
      if (err.response?.status === 404) {
        // No feedback yet — generate it now
        try {
          const genRes = await generateFeedback(sessionId);
          setFeedback(genRes.data.feedback);
        } catch (genErr) {
          setError(genErr.response?.data?.error || 'Failed to generate feedback report.');
        }
      } else {
        setError('Failed to load feedback report.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ label, score }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{score}/10</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full"
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Interview Feedback Report</h1>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
            Analyzing your interview... this can take a few seconds.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {feedback && (
          <>
            {/* Overall score card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Overall Score</p>
              <p className="text-5xl font-bold text-indigo-600">{feedback.overallScore}/10</p>
            </div>

            {/* Score breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Score Breakdown</h2>
              <ScoreBar label="Communication" score={feedback.communicationScore} />
              <ScoreBar label="STAR Structure" score={feedback.starStructureScore} />
              <ScoreBar label="Self-Awareness" score={feedback.selfAwarenessScore} />
            </div>

            {/* Strengths & improvements */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-green-700 mb-2">Strengths</h3>
                <p className="text-sm text-gray-600">{feedback.strengths}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-700 mb-2">Areas to Improve</h3>
                <p className="text-sm text-gray-600">{feedback.improvements}</p>
              </div>
            </div>

            {/* Full report */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Detailed Report</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {feedback.fullReport}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
