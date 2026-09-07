import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function Play() {  
  const [step, setStep] = useState('name')  
  const [name, setName] = useState('')  
  const [userId, setUserId] = useState(null)  
  const [activeWeek, setActiveWeek] = useState(null)  
  const [questions, setQuestions] = useState([])  
  const [answers, setAnswers] = useState({})  
  const [submitted, setSubmitted] = useState(false)  
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)  
  const [loading, setLoading] = useState(false)

  useEffect(() => {  
    fetchActiveWeek()  
  }, [])

  async function fetchActiveWeek() {  
    const { data } = await supabase  
      .from('weeks')  
      .select('*')  
      .eq('is_active', true)  
      .order('week_number', { ascending: false })  
      .limit(1)  
      .single()  
    if (data) setActiveWeek(data)  
  }

  async function handleNameSubmit() {  
    if (!name.trim()) return  
    setLoading(true)

    let { data: user } = await supabase  
      .from('users')  
      .select('*')  
      .eq('name', name.trim())  
      .single()

    if (!user) {  
      const { data: newUser } = await supabase  
        .from('users')  
        .insert({ name: name.trim() })  
        .select()  
        .single()  
      user = newUser  
    }

    if (user) {  
      setUserId(user.id)

      const { data: existingAnswers } = await supabase  
        .from('answers')  
        .select('*, questions!inner(week_id)')  
        .eq('user_id', user.id)

      const hasAnswered = existingAnswers && existingAnswers.some(  
        a => a.questions.week_id === activeWeek.id  
      )

      if (hasAnswered) {  
        setAlreadySubmitted(true)  
        setStep('done')  
      } else {  
        const { data: questionData } = await supabase  
          .from('questions')  
          .select('*')  
          .eq('week_id', activeWeek.id)

        if (questionData) setQuestions(questionData)  
        setStep('play')  
      }  
    }  
    setLoading(false)  
  }

  async function handleSubmit() {  
    if (Object.keys(answers).length < questions.length) {  
      alert('Please answer all questions!')  
      return  
    }  
    setLoading(true)

    const answerRows = questions.map(q => ({  
      user_id: userId,  
      question_id: q.id,  
      answer: answers[q.id],  
      is_correct: null,  
      points: 0,  
    }))

    const { error } = await supabase.from('answers').insert(answerRows)

    if (!error) {  
      setSubmitted(true)  
      setStep('done')  
    } else {  
      alert('Error submitting answers. Try again!')  
    }  
    setLoading(false)  
  }

  if (!activeWeek) {  
    return (  
      <div style={styles.container}>  
        <div style={styles.header}>  
          <h1 style={styles.title}>✨ DWTS Fantasy ✨</h1>  
          <p style={styles.subtitle}>No active week right now. Check back later!</p>  
        </div>  
        <Link href="/">  
          <button style={styles.backButton}>← Back to Home</button>  
        </Link>  
      </div>  
    )  
  }

  if (step === 'name') {  
    return (  
      <div style={styles.container}>  
        <div style={styles.header}>  
          <h1 style={styles.title}>✨ DWTS Fantasy ✨</h1>  
          <p style={styles.subtitle}>Week {activeWeek.week_number} - {activeWeek.theme}</p>  
        </div>  
        <div style={styles.card}>  
          <h2 style={styles.cardTitle}>Enter Your Name</h2>  
          <input  
            type="text"  
            placeholder="Your name"  
            value={name}  
            onChange={(e) => setName(e.target.value)}  
            style={styles.input}  
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}  
          />  
          <button  
            onClick={handleNameSubmit}  
            style={styles.submitButton}  
            disabled={loading || !name.trim()}  
          >  
            {loading ? 'Loading...' : 'Start Playing!'}  
          </button>  
        </div>  
        <Link href="/">  
          <button style={styles.backButton}>← Back to Home</button>  
        </Link>  
      </div>  
    )  
  }

  if (step === 'done') {  
    return (  
      <div style={styles.container}>  
        <div style={styles.header}>  
          <h1 style={styles.title}>✨ DWTS Fantasy ✨</h1>  
        </div>  
        <div style={styles.card}>  
          {alreadySubmitted ? (  
            <>  
              <h2 style={styles.cardTitle}>Already Submitted! ✅</h2>  
              <p style={styles.text}>You already answered Week {activeWeek.week_number} questions, {name}!</p>  
            </>  
          ) : (  
            <>  
              <h2 style={styles.cardTitle}>Submitted! 🎉</h2>  
              <p style={styles.text}>Nice job, {name}! Your answers for Week {activeWeek.week_number} are locked in!</p>  
              <p style={styles.textSmall}>Results will be posted after the episode airs.</p>  
            </>  
          )}  
        </div>  
        <Link href="/">  
          <button style={styles.backButton}>← Back to Home</button>  
        </Link>  
      </div>  
    )  
  }

  return (  
    <div style={styles.container}>  
      <div style={styles.header}>  
        <h1 style={styles.title}>✨ DWTS Fantasy ✨</h1>  
        <p style={styles.subtitle}>Week {activeWeek.week_number} - {activeWeek.theme}</p>  
        <p style={styles.playerBadge}>Playing as: {name}</p>  
      </div>

      {questions.map((q, index) => (  
        <div key={q.id} style={styles.questionCard}>  
          <h3 style={styles.questionTitle}>Question {index + 1}</h3>  
          <p style={styles.questionText}>{q.question_text}</p>  
          <div style={styles.optionsContainer}>  
            {q.options && q.options.map((option, i) => (  
              <button  
                key={i}  
                onClick={() => setAnswers({ ...answers, [q.id]: option })}  
                style={{  
                  ...styles.optionButton,  
                  backgroundColor: answers[q.id] === option ? '#FFD700' : 'rgba(255,255,255,0.05)',  
                  color: answers[q.id] === option ? '#000' : '#fff',  
                  border: answers[q.id] === option ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.1)',  
                }}  
              >  
                {option}  
              </button>  
            ))}  
          </div>  
        </div>  
      ))}

      <button  
        onClick={handleSubmit}  
        style={{  
          ...styles.submitButton,  
          opacity: Object.keys(answers).length < questions.length ? 0.5 : 1,  
        }}  
        disabled={loading}  
      >  
        {loading ? 'Submitting...' : 'Submit Answers 🏆'}  
      </button>

      <Link href="/">  
        <button style={styles.backButton}>← Back to Home</button>  
      </Link>  
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
  header: {  
    textAlign: 'center',  
    padding: '20px 0',  
  },  
  title: {  
    fontSize: '2rem',  
    background: 'linear-gradient(to right, #FFD700, #FFA500)',  
    WebkitBackgroundClip: 'text',  
    WebkitTextFillColor: 'transparent',  
    marginBottom: '5px',  
  },  
  subtitle: {  
    fontSize: '1.1rem',  
    color: '#aaa',  
  },  
  playerBadge: {  
    marginTop: '10px',  
    padding: '5px 15px',  
    backgroundColor: 'rgba(255, 215, 0, 0.15)',  
    borderRadius: '20px',  
    color: '#FFD700',  
    display: 'inline-block',  
    fontSize: '0.9rem',  
  },  
  card: {  
    backgroundColor: 'rgba(255,255,255,0.05)',  
    borderRadius: '12px',  
    padding: '25px',  
    border: '1px solid rgba(255,255,255,0.1)',  
    marginBottom: '20px',  
    textAlign: 'center',  
  },  
  cardTitle: {  
    fontSize: '1.3rem',  
    color: '#FFD700',  
    marginBottom: '15px',  
  },  
  input: {  
    width: '100%',  
    padding: '15px',  
    fontSize: '1.1rem',  
    borderRadius: '10px',  
    border: '2px solid rgba(255,255,255,0.2)',  
    backgroundColor: 'rgba(255,255,255,0.05)',  
    color: '#fff',  
    marginBottom: '15px',  
    boxSizing: 'border-box',  
  },  
  questionCard: {  
    backgroundColor: 'rgba(255,255,255,0.05)',  
    borderRadius: '12px',  
    padding: '20px',  
    border: '1px solid rgba(255,255,255,0.1)',  
    marginBottom: '15px',  
  },  
  questionTitle: {  
    color: '#FFD700',  
    fontSize: '0.9rem',  
    marginBottom: '5px',  
  },  
  questionText: {  
    fontSize: '1.1rem',  
    marginBottom: '15px',  
    color: '#fff',  
  },  
  optionsContainer: {  
    display: 'flex',  
    flexDirection: 'column',  
    gap: '8px',  
  },  
  optionButton: {  
    padding: '12px 15px',  
    borderRadius: '10px',  
    fontSize: '1rem',  
    cursor: 'pointer',  
    textAlign: 'left',  
    transition: 'all 0.2s',  
  },  
  submitButton: {  
    width: '100%',  
    padding: '15px',  
    fontSize: '1.1rem',  
    fontWeight: 'bold',  
    border: 'none',  
    borderRadius: '12px',  
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',  
    color: '#000',  
    cursor: 'pointer',  
    marginBottom: '15px',  
  },  
  backButton: {  
    width: '100%',  
    padding: '10px',  
    fontSize: '0.9rem',  
    border: '1px solid #555',  
    borderRadius: '10px',  
    background: 'transparent',  
    color: '#888',  
    cursor: 'pointer',  
    marginTop: '10px',  
  },  
  text: {  
    fontSize: '1.1rem',  
    color: '#fff',  
    marginBottom: '10px',  
  },  
  textSmall: {  
    fontSize: '0.9rem',  
    color: '#aaa',  
  },  
}  
