import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import Navbar from '../components/Navbar';
import { endSession, generateFeedback, getSession, syncTranscript } from '../api';
import { useAuth } from '../context/AuthContext';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [callStatus, setCallStatus] = useState('idle'); // idle | connecting | active | ended
  const [transcript, setTranscript] = useState([]); // [{role, content}]
  const [error, setError] = useState('');
  const [ending, setEnding] = useState(false);

  const vapiRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Load any existing transcript (e.g. if resuming a session)
  useEffect(() => {
    getSession(sessionId)
      .then((res) => {
        setTranscript(
          res.data.session.messages.map((m) => ({ role: m.role, content: m.content }))
        );
      })
      .catch(() => setError('Failed to load session.'));
  }, [sessionId]);

  // Set up the Vapi client once
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      setError('Vapi public key is not configured. Check your .env file.');
      return;
    }

    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on('call-start', () => setCallStatus('active'));

    vapi.on('call-end', () => setCallStatus('ended'));

    // Fired for every transcript chunk (both user and assistant speech)
    vapi.on('message', (message) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'assistant' ? 'assistant' : 'user';
        const content = message.transcript;

        setTranscript((prev) => [...prev, { role, content }]);

        // Keep our own DB transcript in sync as the live conversation happens
        syncTranscript(sessionId, role, content).catch(() => {
          // non-fatal: live transcript sync failing shouldn't break the call
        });
      }
    });

    vapi.on('error', (e) => {
      console.error('Vapi error:', e);
      setError('A voice connection error occurred. Please try again.');
      setCallStatus('idle');
    });

    return () => {
      vapi.stop();
    };
  }, [sessionId]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startCall = async () => {
    setError('');
    setCallStatus('connecting');

    try {
      // Pass sessionId as call metadata so our backend webhook knows which
      // session this conversation belongs to (used in interview.js webhook)
      await vapiRef.current.start(VAPI_ASSISTANT_ID, {
        metadata: { sessionId },
        variableValues: {
          candidateName: user?.name,
          jobRole: user?.jobRole,
        },
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      setError('Failed to start the voice call. Please check your microphone permissions.');
      setCallStatus('idle');
    }
  };

  const stopCall = () => {
    vapiRef.current?.stop();
    setCallStatus('ended');
  };

  const handleFinishInterview = async () => {
    setEnding(true);
    setError('');

    try {
      if (callStatus === 'active') {
        vapiRef.current?.stop();
      }

      await endSession(sessionId);
      await generateFeedback(sessionId);
      navigate(`/feedback/${sessionId}`);
    } catch (err) {
      setError('Failed to generate feedback. You can try again from the dashboard.');
      setEnding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10 w-full flex-1 flex flex-col">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Behavioral Interview</h1>
        <p className="text-sm text-gray-500 mb-6">
          Speak naturally into your microphone. The AI interviewer will respond and ask follow-ups
          based on what you say.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Call status / controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                callStatus === 'active'
                  ? 'bg-green-500 animate-pulse'
                  : callStatus === 'connecting'
                  ? 'bg-yellow-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {callStatus === 'idle' && 'Ready to start'}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'active' && 'Call in progress — speak now'}
              {callStatus === 'ended' && 'Call ended'}
            </span>
          </div>

          <div className="flex gap-2">
            {callStatus === 'idle' && (
              <button
                onClick={startCall}
                className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700"
              >
                Start Speaking
              </button>
            )}
            {callStatus === 'active' && (
              <button
                onClick={stopCall}
                className="bg-gray-200 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-300"
              >
                Pause Call
              </button>
            )}
            <button
              onClick={handleFinishInterview}
              disabled={ending || transcript.length === 0}
              className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-black disabled:opacity-50"
            >
              {ending ? 'Generating Report...' : 'End Interview & Get Feedback'}
            </button>
          </div>
        </div>

        {/* Live transcript */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex-1 overflow-y-auto max-h-[50vh]">
          {transcript.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              Your conversation will appear here once you start speaking.
            </p>
          ) : (
            <div className="space-y-4">
              {transcript.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-1">
                      {m.role === 'user' ? 'You' : 'Interviewer'}
                    </p>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
