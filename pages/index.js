import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function Home() {  
  const [leaderboard, setLeaderboard] = useState([])  
  const [activeWeek, setActiveWeek] = useState(null)

  useEffect(() => {  
    fetchActiveWeek()  
    fetchLeaderboard()  
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

  async function fetchLeaderboard() {  
    const { data: users } = await supabase.from('users').select('*')  
    if (!users) return

    const leaderboardData = []  
    for (const user of users) {  
      const { data: answers } = await supabase  
        .from('answers')  
        .select('points')  
        .eq('user_id', user.id)

      const totalPoints = answers ? answers.reduce((sum, a) => sum + (a.points || 0), 0) : 0  
      leaderboardData.push({ ...user, total_points: totalPoints })  
    }  
    leaderboardData.sort((a, b) => b.total_points - a.total_points)  
    setLeaderboard(leaderboardData)  
  }

  return (  
    <div style={styles.container}>  
      <div style={styles.header}>  
        <h1 style={styles.title}>✨ DWTS Fantasy ✨</h1>  
        <p style={styles.subtitle}>Season 34</p>  
      </div>

      <div style={styles.nav}>  
        {activeWeek ? (  
          <Link href="/play">  
            <button style={styles.navButton}>  
              📝 Play Week {activeWeek.week_number} - {activeWeek.theme}  
            </button>  
          </Link>  
        ) : (  
          <button style={{...styles.navButton, opacity: 0.5}} disabled>  
            📝 No Active Week Yet  
          </button>  
        )}  
        <Link href="/admin">  
          <button style={styles.navButtonSmall}>🔐 Admin</button>  
        </Link>  
      </div>

      <div style={styles.section}>  
        <h2 style={styles.sectionTitle}>🏆 Leaderboard</h2>  
        <div style={styles.card}>  
          {leaderboard.length === 0 ? (  
            <p style={styles.emptyText}>No scores yet! Play this weeks questions to get on the board.</p>  
          ) : (  
            leaderboard.map((entry, index) => (  
              <div key={entry.id} style={{  
                ...styles.leaderboardRow,  
                backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.15)' :  
                  index === 1 ? 'rgba(192, 192, 192, 0.1)' :  
                  index === 2 ? 'rgba(205, 127, 50, 0.1)' : 'transparent'  
              }}>  
                <span style={styles.rank}>  
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}  
                </span>  
                <span style={styles.playerName}>{entry.name}</span>  
                <span style={styles.points}>{entry.total_points} pts</span>  
              </div>  
            ))  
          )}  
        </div>  
      </div>  
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
    padding: '30px 0',  
  },  
  title: {  
    fontSize: '2.5rem',  
    background: 'linear-gradient(to right, #FFD700, #FFA500)',  
    WebkitBackgroundClip: 'text',  
    WebkitTextFillColor: 'transparent',  
    marginBottom: '5px',  
  },  
  subtitle: {  
    fontSize: '1.2rem',  
    color: '#aaa',  
  },  
  nav: {  
    display: 'flex',  
    flexDirection: 'column',  
    gap: '10px',  
    marginBottom: '30px',  
  },  
  navButton: {  
    padding: '15px 20px',  
    fontSize: '1.1rem',  
    fontWeight: 'bold',  
    border: 'none',  
    borderRadius: '12px',  
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',  
    color: '#000',  
    cursor: 'pointer',  
    width: '100%',  
  },  
  navButtonSmall: {  
    padding: '8px 20px',  
    fontSize: '0.85rem',  
    border: '1px solid #555',  
    borderRadius: '12px',  
    background: 'transparent',  
    color: '#888',  
    cursor: 'pointer',  
    width: '100%',  
  },  
  section: {  
    marginBottom: '30px',  
  },  
  sectionTitle: {  
    fontSize: '1.3rem',  
    marginBottom: '10px',  
    color: '#FFD700',  
  },  
  card: {  
    backgroundColor: 'rgba(255,255,255,0.05)',  
    borderRadius: '12px',  
    padding: '15px',  
    border: '1px solid rgba(255,255,255,0.1)',  
  },  
  leaderboardRow: {  
    display: 'flex',  
    alignItems: 'center',  
    padding: '12px 10px',  
    borderRadius: '8px',  
    marginBottom: '4px',  
  },  
  rank: {  
    fontSize: '1.2rem',  
    width: '40px',  
  },  
  playerName: {  
    flex: 1,  
    fontSize: '1rem',  
    fontWeight: '500',  
  },  
  points: {  
    fontSize: '1rem',  
    fontWeight: 'bold',  
    color: '#FFD700',  
  },  
  emptyText: {  
    color: '#888',  
    textAlign: 'center',  
    padding: '20px',  
  },  
}  
