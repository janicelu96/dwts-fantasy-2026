import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function Admin() {  
  const [password, setPassword] = useState('DWTS_2026')  
  const [authenticated, setAuthenticated] = useState(false)  
  const [weekNumber, setWeekNumber] = useState('')  
  const [theme, setTheme] = useState('')  
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', '', '', ''], correct_answer: '' }])  
  const [weeks, setWeeks] = useState([])  
  const [message, setMessage] = useState('')

  useEffect(() => {  
    if (authenticated) fetchWeeks()  
  }, [authenticated])

  async function fetchWeeks() {  
    const { data } = await supabase.from('weekly_sets').select('*').order('week_number', { ascending: false })  
    if (data) setWeeks(data)  
  }

  function handleLogin() {  
    if (password === 'dwts2026admin') {  
      setAuthenticated(true)  
    } else {  
      setMessage('Wrong password!')  
    }  
  }

  function addQuestion() {  
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: '' }])  
  }

  function updateQuestion(index, field, value) {  
    const updated = [...questions]  
    updated[index][field] = value  
    setQuestions(updated)  
  }

  function updateOption(qIndex, oIndex, value) {  
    const updated = [...questions]  
    updated[qIndex].options[oIndex] = value  
    setQuestions(updated)  
  }

  async function publishWeek() {  
    if (!weekNumber) { setMessage('Enter a week number!'); return }  
    const { data: weekData, error: weekError } = await supabase  
      .from('weekly_sets')  
      .insert([{ week_number: parseInt(weekNumber), theme, is_active: true }])  
      .select()  
    if (weekError) { setMessage('Error: ' + weekError.message); return }  
    const weekId = weekData[0].id  
    for (const q of questions) {  
      const filtered = q.options.filter(o => o.trim() !== '')  
      await supabase.from('questions').insert([{  
        weekly_set_id: weekId,  
        question_text: q.question_text,  
        options: filtered,  
        correct_answer: q.correct_answer  
      }])  
    }  
    setMessage('Week ' + weekNumber + ' published!')  
    setWeekNumber('')  
    setTheme('')  
    setQuestions([{ question_text: '', options: ['', '', '', ''], correct_answer: '' }])  
    fetchWeeks()  
  }

  async function toggleActive(id, current) {  
    await supabase.from('weekly_sets').update({ is_active: !current }).eq('id', id)  
    fetchWeeks()  
  }

  async function gradeWeek(id) {  
    await supabase.from('weekly_sets').update({ is_graded: true, is_active: false }).eq('id', id)  
    const { data: questionsData } = await supabase.from('questions').select('*').eq('weekly_set_id', id)  
    const { data: answers } = await supabase.from('answers').select('*').eq('weekly_set_id', id)  
    const userScores = {}  
    answers?.forEach(a => {  
      const q = questionsData?.find(q => q.id === a.question_id)  
      if (!userScores[a.user_name]) userScores[a.user_name] = 0  
      if (q && a.selected_answer === q.correct_answer) userScores[a.user_name]++  
    })  
    for (const [userName, score] of Object.entries(userScores)) {  
      const { data: existing } = await supabase.from('leaderboard').select('*').eq('user_name', userName).single()  
      if (existing) {  
        await supabase.from('leaderboard').update({ total_score: existing.total_score + score }).eq('user_name', userName)  
      } else {  
        await supabase.from('leaderboard').insert([{ user_name: userName, total_score: score }])  
      }  
    }  
    setMessage('Week graded! Leaderboard updated.')  
    fetchWeeks()  
  }

  if (!authenticated) {  
    return (  
      <div style={styles.container}>  
        <Link href="/"><p style={styles.backLink}>← Back to Home</p></Link>  
        <h1 style={styles.title}>🔐 Admin Login</h1>  
        <div style={styles.card}>  
          <input type="password" placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />  
          <button onClick={handleLogin} style={styles.button}>Login</button>  
          {message && <p style={styles.error}>{message}</p>}  
        </div>  
      </div>  
    )  
  }

  return (  
    <div style={styles.container}>  
      <Link href="/"><p style={styles.backLink}>← Back to Home</p></Link>  
      <h1 style={styles.title}>⚙️ Admin Panel</h1>  
      {message && <p style={styles.success}>{message}</p>}  
      <div style={styles.card}>  
        <h2 style={styles.subtitle}>Create New Week</h2>  
        <input placeholder="Week number" type="number" value={weekNumber} onChange={e => setWeekNumber(e.target.value)} style={styles.input} />  
        <input placeholder="Theme (optional)" value={theme} onChange={e => setTheme(e.target.value)} style={styles.input} />  
        {questions.map((q, qi) => (  
          <div key={qi} style={styles.questionBox}>  
            <h4 style={{ color: '#FFD700' }}>Question {qi + 1}</h4>  
            <input placeholder="Question text" value={q.question_text} onChange={e => updateQuestion(qi, 'question_text', e.target.value)} style={styles.input} />  
            {q.options.map((opt, oi) => (  
              <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} style={styles.input} />  
            ))}  
            <input placeholder="Correct answer (must match an option exactly)" value={q.correct_answer} onChange={e => updateQuestion(qi, 'correct_answer', e.target.value)} style={styles.input} />  
          </div>  
        ))}  
        <button onClick={addQuestion} style={styles.secondaryButton}>+ Add Question</button>  
        <button onClick={publishWeek} style={styles.button}>🚀 Publish Week</button>  
      </div>  
      <div style={styles.card}>  
        <h2 style={styles.subtitle}>Manage Weeks</h2>  
        {weeks.map(w => (  
          <div key={w.id} style={styles.weekRow}>  
            <span>Week {w.week_number} {w.is_graded ? '✅' : w.is_active ? '🟢' : '🔒'}</span>  
            <div>  
              <button onClick={() => toggleActive(w.id, w.is_active)} style={styles.smallButton}>{w.is_active ? 'Close' : 'Open'}</button>  
              {!w.is_graded && <button onClick={() => gradeWeek(w.id)} style={styles.gradeButton}>Grade</button>}  
            </div>  
          </div>  
        ))}  
      </div>  
    </div>  
  )  
}

const styles = {  
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', minHeight: '100vh' },  
  backLink: { color: '#FFD700', marginBottom: '20px', cursor: 'pointer' },  
  title: { fontSize: '2rem', textAlign: 'center', marginBottom: '25px', color: '#FFD700' },  
  subtitle: { color: '#FFD700', marginBottom: '15px' },  
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },  
  input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #555', backgroundColor: '#1a1a2e', color: 'white', fontSize: '1rem' },  
  button: { width: '100%', padding: '12px', backgroundColor: '#FFD700', color: '#000', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },  
  secondaryButton: { width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#FFD700', border: '1px solid #FFD700', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' },  
  questionBox: { borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' },  
  weekRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333' },  
  smallButton: { padding: '5px 12px', marginLeft: '8px', borderRadius: '6px', border: '1px solid #FFD700', backgroundColor: 'transparent', color: '#FFD700', cursor: 'pointer' },  
  gradeButton: { padding: '5px 12px', marginLeft: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer' },  
  error: { color: '#ff6b6b', textAlign: 'center', marginTop: '10px' },  
  success: { color: '#4CAF50', textAlign: 'center', marginBottom: '15px' },  
}  
