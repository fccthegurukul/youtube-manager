import React, { useEffect, useState } from 'react';
import './Toolstips.css';
import { supabase } from '../services/supabase';

export default function Toolstips() {
  const [toolRequest, setToolRequest] = useState('');
  const [requestType, setRequestType] = useState('tool');
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [defaultTopic, setDefaultTopic] = useState('');
  const [defaultGoal, setDefaultGoal] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', user.id)
          .single();
        setUser(profile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('resource_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setMyRequests(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toolRequest || !user) return;

    await supabase.from('resource_requests').insert([
      {
        user_id: user.id,
        user_name: user.name,
        email: user.email,
        request_type: requestType,
        request_text: toolRequest,
      },
    ]);

    setSubmitted(true);
    setToolRequest('');
    setRequestType('tool');
    fetchRequests();
  };

  const generateDefaultMessage = () => {
    if (!defaultTopic && !defaultGoal) return '';
    return `Hi! I'm working on the topic "${defaultTopic}" and my goal is "${defaultGoal}". I'd love some guidance or tips!`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Paused Overlay to block interaction */}
      <div className="paused-overlay">
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffecb3',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}>
           🚫 This service is temporarily suspended and currently unavailable. Please check back later.
           </div>
      </div>

      <div className="toolstips-container">
        <div className="coming-soon-box">
          <h2>🚧 Tools & Resources Under Construction 🚀</h2>
          <p>
            हम इस सेक्शन पर काम कर रहे हैं। जल्द ही आपको यहां यूट्यूब ग्रोथ के लिए कमाल के टूल्स और रिसोर्स मिलेंगे!
          </p>
          <div className="coming-soon-footer">⏳ अनुमानित लॉन्च: जल्द ही!</div>
        </div>

        <div className="request-form-box">
          <h3>📥 कोई सुझाव या जरूरत?</h3>
          <p>हमें बताएं कि आपको क्या चाहिए!</p>

          {submitted ? (
            <div className="success-message">🎉 धन्यवाद! आपकी रिक्वेस्ट रिकॉर्ड हो गई है।</div>
          ) : (
            <form onSubmit={handleSubmit} className="tool-request-form">
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="dropdown-select"
              >
                <option value="tool">🧰 Tool</option>
                <option value="ppt">📊 PPT / Presentation</option>
                <option value="pdf">📄 PDF Guide</option>
                <option value="script">✍️ Script Help</option>
                <option value="hook">🎣 Hook Line Ideas</option>
                <option value="recording">🎥 Recording Instructions</option>
                <option value="editing">✂️ Editing Help</option>
                <option value="other">🔎 Other</option>
              </select>

              <textarea
                placeholder="आपको किस चीज़ की जरूरत है?"
                value={toolRequest}
                onChange={(e) => setToolRequest(e.target.value)}
                required
              />
              <button type="submit">🚀 रिक्वेस्ट भेजें</button>
            </form>
          )}
        </div>

        {myRequests.length > 0 && (
          <div className="user-requests">
            <h4>🧾 आपकी Submitted Requests:</h4>
            {myRequests.map((req) => (
              <div key={req.id} className="request-item">
                <p><strong>📌 Type:</strong> {req.request_type}</p>
                <p><strong>🔹 Request:</strong> {req.request_text}</p>
                <p><strong>🕒 Submitted:</strong> {new Date(req.created_at).toLocaleString()}</p>
                {req.admin_reply ? (
                  <p className="admin-reply"><strong>🗨️ Admin Reply:</strong> {req.admin_reply}</p>
                ) : (
                  <p className="pending-reply">⌛ Awaiting reply...</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="whatsapp-connect-card">
          <h3>📱 WhatsApp Connect</h3>
          <p>
            किसी भी सवाल या सपोर्ट के लिए आप सीधे <strong>+91 91353 65331</strong> पर WhatsApp कर सकते हैं।
          </p>

          <div className="whatsapp-message-tool">
            <h4>✍️ Default Message Generator:</h4>
            <input
              type="text"
              placeholder="आपका टॉपिक"
              value={defaultTopic}
              onChange={(e) => setDefaultTopic(e.target.value)}
            />
            <input
              type="text"
              placeholder="आपका मकसद / goal"
              value={defaultGoal}
              onChange={(e) => setDefaultGoal(e.target.value)}
            />
            <textarea
              readOnly
              value={generateDefaultMessage()}
              placeholder="Generated message here..."
            />
            <a
              href={`https://wa.me/919135365331?text=${encodeURIComponent(generateDefaultMessage())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-button"
            >
              💬 WhatsApp पर भेजें
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
