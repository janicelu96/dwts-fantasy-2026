import { useState, useEffect } from 'react'  
import { useRouter } from 'next/router'  
import { supabase } from '../../lib/supabase'  
import Link from 'next/link'

export default function WeeklyQuestions() {  
  const router = useRouter()  
  const { id } = router.query  
  const [weekSet, setWeekSet] = useState(null)  
  const [questions, setQuestions] = useState([])  
  const [friends, setFriends] = useState([])  
  const [selectedFriend, setSelectedFriend] = useState('')  
  const [answers, setAnswers] = useState({})  
  const [message, setMessage] = useState('')  
  const [existingAnswers, setExistingAnswers] = useState([])  
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {  
    if (id) {  
      fetchWeekData()  
      fetchFriends()  
    }  
  }, [id])

  useEffect(() => {  
    if (selectedFriend && id) {  
      checkExistingAnswers()  
    }  
  }, [selectedFriend, id])

  async function fetchWeekData() {  
    const { data: weekData } = await supabase  
      .from('weekly_sets')  
      .select('*')  
      .eq('id', id)  
      .single()  
    if (weekData) setWeekSet(weekData)

    const { data: questionData } = await supabase  
      .from('weekly_questions')  
      .select('*')  
      .eq('set_id', id)  
      .order('id')  
    if (questionData) setQuestions(questionData)  
  }

  async function fetchFriends() {  
    const { data } = await supabase.from('friends').select('*').order('name')  
    if (data) setFriends(data)  
  }

  async function checkExistingAnswers() {  
    const { data } = await supabase  
      .from('weekly_answers')  
      .select('*')  
      .eq('friend_id', parseInt(selectedFriend))  
      .in('question_id', questions.map(q => q.id))  
      
    if (data && data.length > 0) {  
      setHasSubmitted(true)  
      const answerMap = {}  
      data.forEach(a => {  
        answerMap[a.question_id] = a.answer  
      })  
      setAnswers(answerMap)  
    } else {  
      setHasSubmitted(false)  
      setAnswers({})  
    }  
  }

  async function submitAnswers() {  
    if (!selectedFriend) {  
      setMessage('Please select your name!')  
      return  
    }

    const unanswered = questions.filter(q => !answers[q.id])  
    if (unanswered.length > 0) {  
      setMessage('Please answer all questions!')  
      return  
    }

    if (hasSubmitted) {  
      for (const question of questions) {  
        await supabase  
          .from('weekly_answers')  
          .update({ answer: answers[question.id] })  
          .eq('friend_id', parseInt(selectedFriend))  
          .eq('question_id', question.id)  
      }  
      setMessage('✅ Your answers have been updated!')  
    } else {  
      const inserts = questions.map(q => ({  
        friend_id: parseInt(selectedFriend),  
        question_id: q.id,  
        answer: answers[q.id],  
      }))

      const { error } = await supabase.from('weekly_answers').insert(inserts)  
      if (error) {  
        setMessage('Error: ' + error.message)  
      } else {  
        setMessage('✅ Your answers have been submitted!')  
        setHasSubmitted(true)  
      }  
    }  
  }

  function renderQuestionInput(question) {  
    const castOptions = question.options ? question.options.split(',').map(o => o.trim()) : []  
      
    if (question.question_type === 'multiple_choice' && castOptions.length > 0) {  
      return (  
        <div style={styles.optionsContainer}>  
          {castOptions.map((option, idx) => (  
            <button  
              key={idx}  
              style={{  
                ...styles.optionButton,  
                backgroundColor: answers[question.id] === option ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255,255,255,0.05)',  
                borderColor: answers[question.id] === option ? '#FFD700' : 'rgba(255,255,255,0.1)',  
              }}  
              onClick={() => setAnswers({ ...answers, [question.id]: option })}  
            >  
              {option}  
            </button>  
          ))}  
        </div>  
      )  
    }

    if (question.question_type === 'number') {  
      return (  
        <input  
          type="number"  
          style={styles.input}  
          value={answers[question.id] || ''}  
          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}  
          placeholder="Enter a number..."  
        />  
      )  
    }

    return (  
      <input  
        type="text"  
        style={styles.input}  
        value={answers[question.id] || ''}  
        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}  
        placeholder="Type your answer..."  
      />  
    )  
  }

  if (!weekSet) return <div style={styles.container}><p>Loading...</p></div>

  return (  
    <div style={styles.container}>  
      <Link href="/">  
        <p style={styles.backLink}>← Back to Home</p>  
      </Link>

      <h1 style={styles.title}>📝 Week {weekSet.week_number}</h1>  
      <p style={styles.subtitle}>{weekSet.theme || 'Weekly Questions'}</p>

      <div style={styles.formGroup}>  
        <label style={styles.label}>Your Name:</label>  
        <select  
          style={styles.select}  
          value={selectedFriend}  
          onChange={(e) => setSelectedFriend(e.target.value)}  
        >  
          <option value="">-- Select your name --</option>  
          {friends.map(f => (  
            <option key={f.id} value={f.id}>{f.name}</option>  
          ))}  
        </select>  
      </div>

      {hasSubmitted && (  
        <div style={styles.alreadySubmitted}>  
          ✅ You already submitted! You can update your answers below.  
        </div>  
      )}

      {questions.map((question, index) => (  
        <div key={question.id} style={styles.questionCard}>  
          <p style={styles.questionNumber}>Question {index + 1}</p>  
          <p style={styles.questionText}>{question.question_text}</p>  
          <p style={styles.pointsText}>{question.points} point{question.points > 1 ? 's' : ''}</p>  
          {renderQuestionInput(question)}  
        </div>  
      ))}

      {questions.length > 0 && (  
        <button style={styles.submitButton} onClick={submitAnswers}>  
          {hasSubmitted ? 'Update Answers' : 'Submit Answers'} ✨  
        </button>  
      )}

      {message && <p style={styles.message}>{message}</p>}  
    </div>  
  )  
}

const styles = {  
  container: {  
    maxWidth: '600px',  
    margin: '0 auto',  
    padding: '20px',  
    minHeight: '100vh',  
  },  
  backLink: {  
    color: '#FFD700',  
    marginBottom: '20px',  
    cursor: 'pointer',  
  },  
  title: {  
    fontSize: '2rem',  
    textAlign: 'center',  
    marginBottom: '5px',  
    color: '#FFD700',  
  },  
  subtitle: {  
    textAlign: 'center',  
    color: '#ccc',  
    marginBottom: '25px',  
  },  
  formGroup: {  
    marginBottom: '20px',  
  },  
  label: {  
    display: 'block',  
    marginBottom: '8px',  
    fontWeight: 'bold',  
    color: '#ddd',  
  },  
  select: {  
    width: '100%',  
    padding: '12px',  
    borderRadius: '8px',  
    border: '1px solid rgba(255,255,255,0.2)',  
    backgroundColor: 'rgba(255,255,255,0.1)',  
    color: '#fff',  
    fontSize: '1rem',  
  },  
  alreadySubmitted: {  
    backgroundColor: 'rgba(76, 175, 80, 0.1)',  
    border: '1px solid rgba(76, 175, 80, 0.3)',  
    borderRadius: '8px',  
    padding: '12px',  
    marginBottom: '20px',  
    textAlign: 'center',  
    color: '#4CAF50',  
  },  
  questionCard: {  
    backgroundColor: 'rgba(255,255,255,0.05)',  
    borderRadius: '12px',  
    padding: '20px',  
    border: '1px solid rgba(255,255,255,0.1)',  
    marginBottom: '15px',  
  },  
  questionNumber: {  
    color: '#FFD700',  
    fontSize: '0.85rem',  
    fontWeight: 'bold',  
    marginBottom: '5px',  
  },  
  questionText: {  
    fontSize: '1.1rem',  
    marginBottom: '8px',  
    lineHeight: '1.4',  
  },  
  pointsText: {  
    color: '#888',  
    fontSize: '0.8rem',  
    marginBottom: '12px',  
  },  
  optionsContainer: {  
    display: 'flex',  
    flexDirection: 'column',  
    gap: '8px',  
  },  
  optionButton: {  
    padding: '12px',  
    borderRadius: '8px',  
    border: '1px solid rgba(255,255,255,0.1)',  
    color: '#fff',  
    cursor: 'pointer',  
    textAlign: 'left',  
    fontSize: '0.95rem',  
  },  
  input: {  
    width: '100%',  
    padding: '12px',  
    borderRadius: '8px',  
    border: '1px solid rgba(255,255,255,0.2)',  
    backgroundColor: 'rgba(255,255,255,0.1)',  
    color: '#fff',  
    fontSize: '1rem',  
  },  
  submitButton: {  
    width: '100%',  
    padding: '16px',  
    fontSize: '1.1rem',  
    fontWeight: 'bold',  
    border: 'none',  
    borderRadius: '12px',  
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',  
    color: '#000',  
    cursor: 'pointer',  
    marginBottom: '15px',  
  },  
  message: {  
    textAlign: 'center',  
    color: '#4CAF50',  
    fontWeight: 'bold',  
    marginBottom: '20px',  
  },  
}  
