import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function Admin() {  
  const [password, setPassword] = useState('')  
  const [authenticated, setAuthenticated] = useState(false)  
  const [weekNumber, setWeekNumber] = useState('')  
  const [theme, setTheme] = useState('')  
  const [questions, setQuestions] = useState([{ question_text: '', type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '' }])  
  const [weeks, setWeeks] = useState([])  
  const [message, setMessage] = useState('')

  useEffect(() => {  
    if (authenticated) fetchWeeks()  
  }, [authenticated])

  const fetchWeeks = async () => {  
    const { data } = await supabase  
      .from('weeks')  
      .select('*')  
      .order('week_number', { ascending: false })  
    if (data) setWeeks(data)  
  }

  const handleLogin = () => {  
    if (password === 'dwts2026admin') {  
      setAuthenticated(true)  
    } else {  
      setMessage('Wrong password')  
    }  
  }

  const addQuestion = () => {  
    setQuestions([...questions, { question_text: '', type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '' }])  
  }

  const updateQuestion = (index, field, value) => {  
    const updated = [...questions]  
    updated[index][field] = value  
    if (field === 'type' && value === 'fill_in_blank') {  
      updated[index].options = []  
    } else if (field === 'type' && value === 'multiple_choice') {  
      updated[index].options = ['', '', '', '']  
    }  
    setQuestions(updated)  
  }

  const updateOption = (qIndex, oIndex, value) => {  
    const updated = [...questions]  
    updated[qIndex].options[oIndex] = value  
    setQuestions(updated)  
  }

  const removeQuestion = (index) => {  
    const updated = questions.filter((_, i) => i !== index)  
    setQuestions(updated)  
  }

  const handleSubmit = async () => {  
    if (!weekNumber) {  
      setMessage('Please enter a week number')  
      return  
    }

    const { data: weekData, error: weekError } = await supabase  
      .from('weeks')  
      .insert([{ week_number: parseInt(weekNumber), theme: theme, is_active: true }])  
      .select()

    if (weekError) {  
      setMessage('Error creating week: ' + weekError.message)  
      return  
    }

    const weekId = weekData[0].id

    for (const q of questions) {  
      const { error: qError } = await supabase  
        .from('questions')  
        .insert([{  
          week_id: weekId,  
          question_text: q.question_text,  
          question_type: q.type,  
          options: q.type === 'fill_in_blank' ? [] : q.options.filter(o => o !== ''),  
          correct_answer: q.correct_answer  
        }])

      if (qError) {  
        setMessage('Error adding question: ' + qError.message)  
        return  
      }  
    }

    setMessage('Week ' + weekNumber + ' created successfully!')  
    setWeekNumber('')  
    setTheme('')  
    setQuestions([{ question_text: '', type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '' }])  
    fetchWeeks()  
  }

  const setCorrectAnswers = async (weekId) => {  
    const { data: questionsData } = await supabase  
      .from('questions')  
      .select('*')  
      .eq('week_id', weekId)

    if (!questionsData) return

    for (const q of questionsData) {  
      const answer = prompt(`Correct answer for: "${q.question_text}"`, q.correct_answer || '')  
      if (answer !== null) {  
        await supabase  
          .from('questions')  
          .update({ correct_answer: answer })  
          .eq('id', q.id)  
      }  
    }

    await gradeWeek(weekId)  
    setMessage('Answers saved and graded!')  
    fetchWeeks()  
  }

  const gradeWeek = async (weekId) => {  
    const { data: questionsData } = await supabase  
      .from('questions')  
      .select('*')  
      .eq('week_id', weekId)

    const { data: answers } = await supabase  
      .from('answers')  
      .select('*')  
      .in('question_id', questionsData.map(q => q.id))

    const { data: users } = await supabase  
      .from('users')  
      .select('*')

    for (const user of users) {  
      let weekPoints = 0  
      for (const q of questionsData) {  
        const userAnswer = answers.find(a => a.user_id === user.id && a.question_id === q.id)  
        if (userAnswer) {  
          let isCorrect = false  
          if (q.question_type === 'fill_in_blank') {  
            isCorrect = userAnswer.answer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()  
          } else {  
            isCorrect = userAnswer.answer === q.correct_answer  
          }  
          if (isCorrect) {  
            weekPoints += 1  
            await supabase  
              .from('answers')  
              .update({ is_correct: true, points: 1 })  
              .eq('id', userAnswer.id)  
          } else {  
            await supabase  
              .from('answers')  
              .update({ is_correct: false, points: 0 })  
              .eq('id', userAnswer.id)  
          }  
        }  
      }

      await supabase  
        .from('users')  
        .update({ total_points: (user.total_points || 0) + weekPoints })  
        .eq('id', user.id)  
    }  
  }

  const toggleWeekActive = async (weekId, currentStatus) => {  
    await supabase  
      .from('weeks')  
      .update({ is_active: !currentStatus })  
      .eq('id', weekId)  
    fetchWeeks()  
  }

  if (!authenticated) {  
    return (  
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>  
        <h1 style={{ color: '#DAA520', textAlign: 'center' }}>Admin Login</h1>  
        <input  
          type="password"  
          placeholder="Enter admin password"  
          value={password}  
          onChange={(e) => setPassword(e.target.value)}  
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}  
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #DAA520', backgroundColor: '#1a1a2e', color: 'white', fontSize: '16px' }}  
        />  
        <button  
          onClick={handleLogin}  
          style={{ width: '100%', padding: '12px', backgroundColor: '#DAA520', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}  
        >  
          Login  
        </button>  
        {message && <p style={{ color: 'red', textAlign: 'center' }}>{message}</p>}  
        <div style={{ textAlign: 'center', marginTop: '20px' }}>  
          <Link href="/" style={{ color: '#DAA520' }}>← Back to Home</Link>  
        </div>  
      </div>  
    )  
  }

  return (  
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>  
      <h1 style={{ color: '#DAA520', textAlign: 'center' }}>Admin Panel</h1>

      <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>  
        <h2 style={{ color: '#DAA520' }}>Create New Week</h2>

        <input  
          type="number"  
          placeholder="Week Number"  
          value={weekNumber}  
          onChange={(e) => setWeekNumber(e.target.value)}  
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #DAA520', backgroundColor: '#1a1a2e', color: 'white', fontSize: '16px' }}  
        />

        <input  
          type="text"  
          placeholder="Theme (e.g., Premiere Night)"  
          value={theme}  
          onChange={(e) => setTheme(e.target.value)}  
          style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #DAA520', backgroundColor: '#1a1a2e', color: 'white', fontSize: '16px' }}  
        />

        {questions.map((q, qIndex) => (  
          <div key={qIndex} style={{ backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #333' }}>  
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>  
              <h3 style={{ color: '#DAA520', margin: 0 }}>Question {qIndex + 1}</h3>  
              {questions.length > 1 && (  
                <button  
                  onClick={() => removeQuestion(qIndex)}  
                  style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}  
                >  
                  Remove  
                </button>  
              )}  
            </div>

            <select  
              value={q.type}  
              onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}  
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #DAA520', backgroundColor: '#16213e', color: 'white', fontSize: '16px' }}  
            >  
              <option value="multiple_choice">Multiple Choice</option>  
              <option value="fill_in_blank">Fill in the Blank</option>  
            </select>

            <input  
              type="text"  
              placeholder="Question text"  
              value={q.question_text}  
              onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}  
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #555', backgroundColor: '#16213e', color: 'white', fontSize: '16px' }}  
            />

            {q.type === 'multiple_choice' && q.options.map((opt, oIndex) => (  
              <input  
                key={oIndex}  
                type="text"  
                placeholder={`Option ${oIndex + 1}`}  
                value={opt}  
                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}  
                style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#0f3460', color: 'white', fontSize: '14px' }}  
              />  
            ))}

            {q.type === 'fill_in_blank' && (  
              <p style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>  
                Users will type their answer. You will set the correct answer later when grading.  
              </p>  
            )}  
          </div>  
        ))}

        <button  
          onClick={addQuestion}  
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f3460', color: '#DAA520', border: '1px solid #DAA520', borderRadius: '8px', marginBottom: '15px', cursor: 'pointer', fontSize: '16px' }}  
        >  
          + Add Question  
        </button>

        <button  
          onClick={handleSubmit}  
          style={{ width: '100%', padding: '12px', backgroundColor: '#DAA520', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}  
        >  
          Create Week  
        </button>

        {message && <p style={{ color: '#DAA520', textAlign: 'center', marginTop: '10px' }}>{message}</p>}  
      </div>

      <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '12px' }}>  
        <h2 style={{ color: '#DAA520' }}>Manage Weeks</h2>  
        {weeks.map(week => (  
          <div key={week.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #333' }}>  
            <span style={{ color: 'white' }}>Week {week.week_number} {week.theme ? `- ${week.theme}` : ''} {week.is_active ? '🟢' : '🔴'}</span>  
            <div>  
              <button  
                onClick={() => setCorrectAnswers(week.id)}  
                style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#DAA520', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}  
              >  
                Grade  
              </button>  
              <button  
                onClick={() => toggleWeekActive(week.id, week.is_active)}  
                style={{ padding: '6px 12px', backgroundColor: week.is_active ? '#ff4444' : '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}  
              >  
                {week.is_active ? 'Close' : 'Open'}  
              </button>  
            </div>  
          </div>  
        ))}  
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>  
        <Link href="/" style={{ color: '#DAA520' }}>← Back to Home</Link>  
      </div>  
    </div>  
  )  
}  
