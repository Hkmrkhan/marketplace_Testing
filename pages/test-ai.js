import { useState } from 'react';
import AIChat from '../components/AIChat';
import styles from '../styles/Home.module.css';

export default function TestAIPage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <main className={styles.main}>
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1>AI Chatbot Test Page</h1>
          <p>Testing AI chatbot functionality</p>
          
          <button 
            onClick={() => setShowChat(!showChat)}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              margin: '20px'
            }}
          >
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
          
          {showChat && (
            <div style={{ margin: '20px auto', maxWidth: '400px' }}>
              <AIChat context="test" isFloating={false} />
            </div>
          )}
          
          <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3>🎉 AI Chatbot is Now Global!</h3>
            <p>The AI chatbot floating button now appears on <strong>ALL pages</strong> of the website!</p>
            <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
              <li>✅ Home page</li>
              <li>✅ Cars page</li>
              <li>✅ Buyer dashboard</li>
              <li>✅ Seller dashboard</li>
              <li>✅ All other pages</li>
            </ul>
            <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#667eea' }}>
              🤖 Look for the blue floating button at the bottom right of any page!
            </p>
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🔒 Hidden on Auth Pages:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404' }}>
                <li>❌ Login page</li>
                <li>❌ Signup page</li>
                <li>❌ Reset password</li>
                <li>❌ Forgot password</li>
                <li>❌ Email verification</li>
              </ul>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#856404' }}>
                <strong>Reason:</strong> Users need to authenticate first before using AI assistant
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Note: AI Chat is now global and appears on all pages */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '20px', 
        background: '#667eea', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        🤖 AI Chat is now global!
      </div>
    </div>
  );
}

