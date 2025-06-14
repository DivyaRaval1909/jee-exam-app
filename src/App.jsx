import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from './firebase';

// Mock 25 MCQs
const questions = Array.from({ length: 25 }, (_, i) => ({
  question: `Q${i + 1}. What is the answer to question ${i + 1}?`,
  options: [
    'Option A',
    'Option B',
    'Option C',
    'Option D',
  ],
}));
// Mock answer key for 25 MCQs (0 = Option A, 1 = Option B, ...)
const answerKey = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];

const SECTIONS = [
  { key: 'phy', label: 'Physics' },
  { key: 'chem', label: 'Chemistry' },
  { key: 'math', label: 'Math' }, // Change to 'Biology' for NEET
];
const LANGUAGES = ['English', 'Hindi'];
const TOTAL_TIME = 3 * 60 * 60; // 3 hours in seconds

function App() {
  const [enroll, setEnroll] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({ phy: Array(25).fill(null), chem: Array(25).fill(null), math: Array(25).fill(null) });
  const [section, setSection] = useState(SECTIONS[0].key);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [timer, setTimer] = useState(TOTAL_TIME);
  const [showInstructions, setShowInstructions] = useState(false);
  const [marked, setMarked] = useState({ phy: Array(25).fill(false), chem: Array(25).fill(false), math: Array(25).fill(false) });
  const [paletteStatus, setPaletteStatus] = useState({ phy: Array(25).fill('not-visited'), chem: Array(25).fill('not-visited'), math: Array(25).fill('not-visited') });
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [finalConfirmChecked, setFinalConfirmChecked] = useState(false);
  const [showResultPage, setShowResultPage] = useState(false);
  const [resultParams, setResultParams] = useState(null);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const timerRef = useRef();

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Palette status update for section
  useEffect(() => {
    setPaletteStatus(prev => {
      const updated = { ...prev };
      updated[section] = [...updated[section]];
      updated[section][currentQ] = answers[section][currentQ] !== null
        ? (marked[section][currentQ] ? 'answered-marked' : 'answered')
        : (marked[section][currentQ] ? 'marked' : 'visited');
      return updated;
    });
  }, [currentQ, answers, marked, section]);

  // Timer warning color
  let timerColor = '#fff';
  if (timer <= 5 * 60) timerColor = '#e53e3e';
  else if (timer <= 15 * 60) timerColor = '#d69e2e';
  else if (timer <= 30 * 60) timerColor = '#3182ce';

  // Auto-submit when timer runs out
  useEffect(() => {
    if (testStarted && timer === 0) {
      handleMCQSubmit();
    }
  }, [timer, testStarted]);

  // Add state for signup fields
  const [candidateName, setCandidateName] = useState('');
  const [dob, setDob] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Use enrollment number as email for login
        await signInWithEmailAndPassword(auth, `${enroll}@exam.com`, password);
        setLoggedIn(true);
      } else {
        // Use enrollment number as email for signup
        // Here you would also save candidateName and dob to your DB if needed
        await createUserWithEmailAndPassword(auth, `${enroll}@exam.com`, password);
        alert('Signup successful! Please login to continue.');
        setIsLogin(true);
        setEnroll('');
        setPassword('');
        setCandidateName('');
        setDob('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Section-wise questions for each section
  const sectionQuestions = {
    phy: Array.from({ length: 25 }, (_, i) => ({
      question: `Physics Q${i + 1}. What is the answer to Physics question ${i + 1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
    })),
    chem: Array.from({ length: 25 }, (_, i) => ({
      question: `Chemistry Q${i + 1}. What is the answer to Chemistry question ${i + 1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
    })),
    math: Array.from({ length: 25 }, (_, i) => ({
      question: `Math Q${i + 1}. What is the answer to Math question ${i + 1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
    })),
  };

  // Section-aware handlers
  const handleOptionChange = (idx) => {
    const newAnswers = { ...answers };
    newAnswers[section] = [...newAnswers[section]];
    newAnswers[section][currentQ] = idx;
    setAnswers(newAnswers);
  };
  const handleNav = (dir) => {
    setCurrentQ((prev) => Math.max(0, Math.min(24, prev + dir)));
  };
  const handleDirectNav = (idx) => setCurrentQ(idx);

  // On Submit All, open confirmation modal
  const handleMCQSubmit = () => {
    setShowFinalConfirm(true);
  };
  const handleMarkForReview = () => {
    const newMarked = { ...marked };
    newMarked[section] = [...newMarked[section]];
    newMarked[section][currentQ] = !newMarked[section][currentQ];
    setMarked(newMarked);
    handleNav(1);
  };
  const handleClearResponse = () => {
    const newAnswers = { ...answers };
    newAnswers[section] = [...newAnswers[section]];
    newAnswers[section][currentQ] = null;
    setAnswers(newAnswers);
  };

  // Show submit confirmation modal
  if (showFinalConfirm) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: 400, maxWidth: '95vw', padding: 32, textAlign: 'center' }}>
          <h3>Are you sure you want to submit?</h3>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '18px 0', gap: 8, fontSize: 16 }}>
            <input type="checkbox" checked={finalConfirmChecked} onChange={e => setFinalConfirmChecked(e.target.checked)} />
            I confirm I have reviewed my answers.
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button onClick={() => setShowFinalConfirm(false)} style={{ background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}>Cancel</button>
            <button
              onClick={() => {
                setShowFinalConfirm(false);
                setShowSubmitted(true);
              }}
              style={{ background: finalConfirmChecked ? '#38a169' : '#e2e8f0', color: finalConfirmChecked ? '#fff' : '#a0aec0', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}
              disabled={!finalConfirmChecked}
            >Submit Test</button>
          </div>
        </div>
      </div>
    );
  }

  // Show 'submitted' (result) page if submitted
  if (showSubmitted) {
    // Calculate analysis (JEE format: +4 correct, -1 incorrect, 0 unattempted)
    let total = 0, attempted = 0, correct = 0, incorrect = 0, unattempted = 0;
    Object.keys(answers).forEach(sec => {
      for (let i = 0; i < 25; i++) {
        total++;
        if (answers[sec][i] !== null) {
          attempted++;
          if (answers[sec][i] === answerKey[i]) {
            correct++;
          } else {
            incorrect++;
          }
        } else {
          unattempted++;
        }
      }
    });
    const marks = correct * 4 - incorrect;
    // Pie chart data
    const pieData = [
      { label: 'Correct', value: correct, color: '#38a169' },
      { label: 'Incorrect', value: incorrect, color: '#e53e3e' },
      { label: 'Unattempted', value: unattempted, color: '#a0aec0' },
    ];
    const totalPie = correct + incorrect + unattempted;
    let acc = 0;
    const pieSlices = pieData.map((d, i) => {
      const start = acc;
      const angle = (d.value / totalPie) * 360;
      acc += angle;
      const large = angle > 180 ? 1 : 0;
      const r = 70;
      const x1 = 100 + r * Math.cos((Math.PI * (start - 90)) / 180);
      const y1 = 100 + r * Math.sin((Math.PI * (start - 90)) / 180);
      const x2 = 100 + r * Math.cos((Math.PI * (start + angle - 90)) / 180);
      const y2 = 100 + r * Math.sin((Math.PI * (start + angle - 90)) / 180);
      return (
        <path
          key={d.label}
          d={`M100,100 L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
          fill={d.color}
        />
      );
    });
    // Pie chart legend
    const legend = (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 18 }}>
        {pieData.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#222', fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>
            <span style={{ width: 16, height: 16, background: d.color, borderRadius: '50%', display: 'inline-block' }}></span>
            {d.label}: {d.value}
          </div>
        ))}
      </div>
    );
    // Get name from localStorage if available (for login after signup)
    const displayName = candidateName || localStorage.getItem('candidateName') || '';
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius:15,  maxWidth: 1350, width: '100%', textAlign: 'center', fontFamily: 'Inter, Arial, sans-serif' }}>
          <div style={{ color: '#111', fontSize: 34, fontWeight: 800, marginBottom: 18, letterSpacing: '-1px', fontFamily: 'Inter, Arial, sans-serif' }}>Result Summary</div>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ margin: '0 auto', display: 'block' }}>{pieSlices}</svg>
          {legend}
          <div style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: 18, lineHeight: 2, marginTop: 32, color: '#18181b', background: '#f1f5f9', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, fontWeight: 600 }}>
            <div>Name:</div><div style={{ textAlign: 'right' }}>{displayName}</div>
            <div>Enrollment Number:</div><div style={{ textAlign: 'right' }}>{enroll}</div>
            <div>Total Questions:</div><div style={{ textAlign: 'right' }}>{total}</div>
            <div>Attempted:</div><div style={{ textAlign: 'right' }}>{attempted}</div>
            <div>Correct:</div><div style={{ textAlign: 'right', color: '#38a169' }}>{correct}</div>
            <div>Incorrect:</div><div style={{ textAlign: 'right', color: '#e53e3e' }}>{incorrect}</div>
            <div>Unattempted:</div><div style={{ textAlign: 'right', color: '#a0aec0' }}>{unattempted}</div>
            <div>Marks:</div><div style={{ textAlign: 'right', color: '#111' }}>{marks} / 300</div>
            <div>Negative Marks:</div><div style={{ textAlign: 'right', color: '#e53e3e' }}>{-incorrect}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minWidth: 340 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/jeelogo.png" alt="JEE Logo" style={{ width: 64, marginBottom: 8, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            <h2 style={{ margin: 0, fontWeight: 700, color: '#2d3748' }}>JEE NTA EXAMINATION 2025</h2>
            <div style={{ color: '#718096', fontSize: 14 }}>{isLogin ? 'Login to continue' : 'Create your account'}</div>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter Enrollment Number"
              value={enroll}
              onChange={(e) => setEnroll(e.target.value)}
              required
              style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Candidate Name"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              required
              style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
            />
            {!isLogin && (
              <input
                type="date"
                placeholder="Date of Birth"
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
              />
            )}
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
            />
            <button type="submit" style={{ width: '100%', padding: 12, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              {isLogin ? 'Login' : 'Signup'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: '#3182ce', fontWeight: 500 }}>
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show instructions and checkbox before test starts
  if (!testStarted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 500, marginTop: 48 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Instructions</h2>
          <ul style={{ fontSize: 15, color: '#2d3748', marginBottom: 18 }}>
            <li>Timer starts after you click "Start Test". No pausing allowed.</li>
            <li>Auto-submit after 3 hours or if you click Submit.</li>
            <li>Color warning for last 30/15/5 mins.</li>
            <li>Save & Next is required to record answers.</li>
            <li>Mark for Review can be used with or without answering.</li>
            <li>Sections can be attempted in any order.</li>
            <li>Right-click, refresh, and keyboard shortcuts are disabled.</li>
          </ul>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <input type="checkbox" checked={hasReadInstructions} onChange={e => setHasReadInstructions(e.target.checked)} style={{ marginRight: 8 }} />
            I have read and understood the instructions.
          </label>
          <button
            disabled={!hasReadInstructions}
            onClick={() => setTestStarted(true)}
            style={{ width: '100%', padding: 12, background: hasReadInstructions ? '#3182ce' : '#e2e8f0', color: hasReadInstructions ? '#fff' : '#a0aec0', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16 }}
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  // Timer formatting
  const hours = String(Math.floor(timer / 3600)).padStart(2, '0');
  const mins = String(Math.floor((timer % 3600) / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');

  // MCQ interface
  const q = sectionQuestions[section][currentQ];
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Timer and header */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#2d3748', color: timerColor, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', fontSize: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/jeelogo.png" alt="JEE Logo" style={{ width: 38, height: 38, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: '#fff', padding: 2 }} />
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 20, letterSpacing: 1 }}>JEE NTA EXAMINATION 2025</span>
        </div>
        <div>Time Left: {hours}:{mins}:{secs}</div>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ fontSize: 16, borderRadius: 6, padding: 4 }}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <button onClick={() => setShowInstructions(true)} style={{ marginLeft: 16, marginRight: 100, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, position: 'relative' }}>Instructions</button>
        </div>
      </div>
      {/* Section Tabs */}
      <div style={{ marginTop: 80, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: section === s.key ? '#3182ce' : '#e2e8f0', color: section === s.key ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 18 }}>{s.label}</button>
        ))}
      </div>
      {/* Main Content */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginTop: 32, gap: 32 }}>
        {/* Palette */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 32, minWidth: 240, minHeight: 340 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 18 }}>Question Palette</div>
          {/* Palette grid 5x5 for current section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 48px)',
            gridGap: 12,
            justifyContent: 'center',
            marginBottom: 18
          }}>
            {sectionQuestions[section].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQ(idx)}
                style={{ width: 48, height: 48, borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 18, cursor: 'pointer',
                  background: paletteStatus[section][idx] === 'not-visited' ? '#e2e8f0'
                    : paletteStatus[section][idx] === 'visited' ? '#fc8181'
                    : paletteStatus[section][idx] === 'answered' ? '#68d391'
                    : paletteStatus[section][idx] === 'marked' ? '#9f7aea'
                    : paletteStatus[section][idx] === 'answered-marked' ? 'linear-gradient(135deg,#9f7aea 60%,#68d391 40%)' : '#e2e8f0',
                  color: idx === currentQ ? '#fff' : '#2d3748',
                  borderBottom: marked[section][idx] ? '3px solid #9f7aea' : undefined
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div style={{ marginTop: 18, fontSize: 15 }}>
            <div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#e2e8f0', borderRadius: 4, marginRight: 6 }} /> Not Visited</div>
            <div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#fc8181', borderRadius: 4, marginRight: 6 }} /> Visited</div>
            <div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#68d391', borderRadius: 4, marginRight: 6 }} /> Answered</div>
            <div><span style={{ display: 'inline-block', width: 18, height: 18, background: '#9f7aea', borderRadius: 4, marginRight: 6 }} /> Marked</div>
            <div><span style={{ display: 'inline-block', width: 18, height: 18, background: 'linear-gradient(135deg,#9f7aea 60%,#68d391 40%)', borderRadius: 4, marginRight: 6 }} /> Answered & Marked</div>
          </div>
        </div>
        {/* Question Panel */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: 600, maxWidth: '98vw', padding: 48, minHeight: 380 }}>
          <div style={{ color: '#2d3748', fontWeight: 600, fontSize: 22, marginBottom: 16 }}>Question {currentQ + 1} / 25</div>
          <div style={{ fontWeight: 500, marginBottom: 28, fontSize: 18 }}>{q.question}</div>
          <div>
            {q.options.map((opt, idx) => (
              <label key={idx} style={{ display: 'block', marginBottom: 10, cursor: 'pointer', borderRadius: 8, border: answers[section][currentQ] === idx ? '2px solid #3182ce' : '1px solid #e2e8f0', padding: 10, background: answers[section][currentQ] === idx ? '#ebf8ff' : '#f7fafc' }}>
                <input
                  type="radio"
                  name={`q${currentQ}`}
                  checked={answers[section][currentQ] === idx}
                  onChange={() => handleOptionChange(idx)}
                  style={{ marginRight: 10 }}
                />
                {opt}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleClearResponse} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e2e8f0', color: '#2d3748', fontWeight: 600 }}>Clear Response</button>
            <button onClick={handleMarkForReview} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: marked[section][currentQ] ? '#9f7aea' : '#e2e8f0', color: marked[section][currentQ] ? '#fff' : '#2d3748', fontWeight: 600 }}>Mark for Review & Next</button>
            <button onClick={() => { handleNav(1); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3182ce', color: '#fff', fontWeight: 600 }}>Save & Next</button>
          </div>
          <button onClick={handleMCQSubmit} style={{ width: '100%', marginTop: 28, padding: 12, background: '#38a169', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16 }}>Submit All</button>
        </div>
      </div>
      {/* Instructions Modal */}
      {showInstructions && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 480, maxWidth: '95vw', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            <h2>Instructions</h2>
            <ul style={{ fontSize: 15, color: '#2d3748' }}>
              <li>Each section contains 25 questions.</li>
              <li>Use the palette to navigate and track your progress.</li>
              <li>Color codes: Grey (Not visited), Red (Visited), Green (Answered), Purple (Marked), Purple+Green (Answered & Marked).</li>
              <li>Use Save & Next, Mark for Review, and Clear Response as needed.</li>
              <li>Submit is final. Review your answers before submitting.</li>
            </ul>
            <button onClick={() => setShowInstructions(false)} style={{ marginTop: 18, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
