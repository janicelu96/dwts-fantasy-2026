import { useState, useEffect } from 'react'  
import { useRouter } from 'next/router'  
import { supabase } from '../../lib/supabase'  
import Link from 'next/link'

export default function WeeklyQuestions() {  
  const router = useRouter()  
  const { id } = router.query  
  const [week, setWeek] = useState(null)  
  const [questions, setQuestions] = useState([])  
  const [answers, setAnswers] = useState({})  
  const [users, setUsers] = useState([])  
  const [selectedUser, setSelectedUser] = useState('')  
  const [submitted, setSubmitted] = useState(false)  
  const [message, setMessage] = useState('')  
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {  
    if (id) {  
      fetchWeek()  
      fetchUsers()  
    }  
  }, [id])

  useEffect(() => {  
    if (selectedUser && questions.length > 0) {  
      checkExistingAnswers()  
    }  
  }, [selectedUser, questions])

  const fetchWeek = async () => {  
    const { data: weekData } = await supabase  
      .from('weeks')  
      .select('*')  
      .eq('id', id)  
      .single()

    if (weekData) {  
      setWeek(weekData)  
      const { data: questionsData } = await supabase  
        .from('questions')  
        .select('*')  
        .eq('week_id', weekData.id)

      if (questionsData) setQuestions(questionsData)  
    }  
  }

  const fetchUsers = async () => {  
    const { data } = await supabase  
      .from('users')  
      .select('*')  
      .order('display_name')  
    if (data) setUsers(data)  
  }

  const checkExistingAnswers = async () => {  
    const { data } = await supabase  
      .from('answers')  
      .select('*')  
      .eq('user_id', selectedUser)  
      .in('question_id', questions.map(q => q.id))

    if (data && data.length > 0) {  
      setAlreadySubmitted(true)  
      const existingAnswers = {}  
      data.forEach(a => {  
        existingAnswers[a.question_id] = a.answer  
      })  
      setAnswers(existingAnswers)  
    } else {  
      setAlreadySubmitted(false)  
      setAnswers({})  
    }  
  }

  const handleSubmit = async () => {  
    if (!selectedUser) {  
      setMessage('Please select your name')  
      return  
    }

    const unanswered = questions.filter(q => !answers[q.id])  
    if (unanswered.length > 0) {  
      setMessage('Please answer all questions')  
      return  
    }

    for (const q of questions) {  
      const { error } = await supabase  
        .from('answers')  
        .insert([{  
          user_id: selectedUser,  
          question_id: q.id,  
          answer: answers[q.id]  
        }])

      if (error) {  
        setMessage('Error submitting: ' + error.message)  
        return  
      }  
    }

    setSubmitted(true)  
    setMessage('Answers submitted successfully! 🎉')  
  }

  if (!week) {  
    return (  
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial' }}>  
        <p style={{ color: 'white' }}>Loading...</p>  
      </div>  
    )  
  }

  return (  
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>  
      <h1 style={{ color: '#DAA520', textAlign: 'center' }}>Week {week.week_number}</h1>  
      {week.theme && <p style={{ color: '#888', textAlign: 'center', fontSize: '18px' }}>{week.theme}</p>}

      {!submitted && !alreadySubmitted && (  
        <>  
          <div style={{ marginBottom: '20px' }}>  
            <label style={{ color: '#DAA520', display: 'block', marginBottom: '8px', fontSize: '16px' }}>Who are you?</label>  
            <select  
              value={selectedUser}  
              onChange={(e) => setSelectedUser(e.target.value)}  
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DAA520', backgroundColor: '#1a1a2e', color: 'white', fontSize: '16px' }}  
            >  
              <option value="">Select your name</option>  
              {users.map(u => (  
                <option key={u.id} value={u.id}>{u.display_name}</option>  
              ))}  
            </select>  
          </div>

          {selectedUser && questions.map((q, index) => (  
            <div key={q.id} style={{ backgroundColor: '#16213e', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>  
              <h3 style={{ color: '#DAA520', marginBottom: '10px' }}>Q{index + 1}: {q.question_text}</h3>

              {q.question_type === 'fill_in_blank' ? (  
                <input  
                  type="text"  
                  placeholder="Type your answer..."  
                  value={answers[q.id] || ''}  
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}  
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DAA520', backgroundColor: '#1a1a2e', color: 'white', fontSize: '16px' }}  
                />  
              ) : (  
                q.options && q.options.map((opt, oIndex) => (  
                  <button  
                    key={oIndex}  
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}  
                    style={{  
                      display: 'block',  
                      width: '100%',  
                      padding: '10px',  
                      marginBottom: '8px',  
                      borderRadius: '8px',  
                      border: answers[q.id] === opt ? '2px solid #DAA520' : '1px solid #444',  
                      backgroundColor: answers[q.id] === opt ? '#DAA520' : '#1a1a2e',  
                      color: answers[q.id] === opt ? 'black' : 'white',  
                      cursor: 'pointer',  
                      fontSize: '14px',  
                      fontWeight: answers[q.id] === opt ? 'bold' : 'normal'  
                    }}  
                  >  
                    {opt}  
                  </button>  
                ))  
              )}  
            </div>  
          ))}

          {selectedUser && (  
            <button  
              onClick={handleSubmit}  
              style={{ width: '100%', padding: '14px', backgroundColor: '#DAA520', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', marginBottom: '15px' }}  
            >  
              Submit Answers  
            </button>  
          )}  
        </>  
      )}

      {alreadySubmitted && !submitted && (  
        <div style={{ textAlign: 'center', padding: '20px' }}>  
          <p style={{ color: '#DAA520', fontSize: '18px' }}>✅ You already submitted answers for this week!</p>  
          {questions.map((q, index) => (  
            <div key={q.id} style={{ backgroundColor: '#16213e', padding: '15px', borderRadius: '12px', marginBottom: '10px', textAlign: 'left' }}>  
              <p style={{ color: '#DAA520', marginBottom: '5px' }}>Q{index + 1}: {q.question_text}</p>  
              <p style={{ color: 'white' }}>Your answer: {answers[q.id]}</p>  
            </div>  
          ))}  
        </div>  
      )}

      {submitted && (  
        <div style={{ textAlign: 'center', padding: '20px' }}>  
          <p style={{ color: '#DAA520', fontSize: '20px' }}>🎉 Answers submitted!</p>  
        </div>  
      )}

      {message && <p style={{ color: '#DAA520', textAlign: 'center' }}>{message}</p>}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>  
        <Link href="/" style={{ color: '#DAA520' }}>← Back to Home</Link>  
      </div>  
    </div>  
  )  
}  
