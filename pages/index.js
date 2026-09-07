import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function Home() {  
  const [leaderboard, setLeaderboard] = useState([])  
  const [activeWeek, setActiveWeek] = useState(null)  
  const [mirrorballPicks, setMirrorballPicks] = useState([])  
  const [castMembers, setCastMembers] = useState([])

  useEffect(() => {  
    fetchLeaderboard()  
    fetchActiveWeek()  
    fetchMirrorballPicks()  
  }, [])

  async function fetchLeaderboard() {  
    const { data } = await supabase.from('leaderboard').select('*')  
    if (data) setLeaderboard(data)  
  }

  async function fetchActiveWeek() {  
    const { data } = await supabase  
      .from('weekly_sets')  
      .select('*')  
      .eq('is_active', true)  
      .single()  
    if (data) setActiveWeek(data)  
  }

  async function fetchMirrorballPicks() {  
    const { data } = await supabase  
      .from('mirrorball_picks')  
      .select('*, friends(name), cast_members(celebrity_name, pro_partner)')  
    if (data) setMirrorballPicks(data)  
  }

  return (  
    <div style={styles.container}>  
      <div style={styles.header}>  
        <h1 style={styles.title}>✨ DWTS Fantasy ✨</h1>  
        <p style={styles.subtitle}>Season 34</p>  
      </div>

      <div style={styles.nav}>  
        {activeWeek && (  
          <Link href={`/weekly/${activeWeek.id}`}>  
            <button style={styles.navButton}>  
              📝 This Week's Questions (Week {activeWeek.week_number})  
            </button>  
          </Link>  
        )}  
        <Link href="/mirrorball">  
          <button style={styles.navButtonAlt}>🏆 Mirrorball Pick</button>  
        </Link>  
        <Link href="/history">  
          <button style={styles.navButtonAlt}>📅 Past Weeks</button>  
        </Link>  
        <Link href="/admin">  
          <button style={styles.navButtonSmall}>🔐 Admin</button>  
        </Link>  
      </div>

      <div style={styles.section}>  
        <h2 style={styles.sectionTitle}>🏆 Leaderboard</h2>  
        <div style={styles.card}>  
          {leaderboard.length === 0 ? (  
            <p style={styles.emptyText}>No scores yet! Questions will be graded after each episode.</p>  
          ) : (  
            leaderboard.map((entry, index) => (  
              <div key={entry.friend_id} style={{  
                ...styles.leaderboardRow,  
                backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.15)' :  
                  index === 1 ? 'rgba(192, 192, 192, 0.1)' :  
                  index === 2 ? 'rgba(205, 127, 50, 0.1)' : 'transparent'  
              }}>  
                <span style={styles.rank}>  
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}  
                </span>  
                <span style={styles.playerName}>{entry.name}</span>  
                <span style={styles.points}>{entry.total_points} pts</span>  
              </div>  
            ))  
          )}  
        </div>  
      </div>

      {mirrorballPicks.length > 0 && (  
        <div style={styles.section}>  
          <h2 style={styles.sectionTitle}>🪩 Mirrorball Picks</h2>  
          <div style={styles.card}>  
            {mirrorballPicks.map((pick) => (  
              <div key={pick.id} style={styles.pickRow}>  
                <span style={styles.playerName}>{pick.friends?.name}</span>  
                <span style={styles.pickValue}>  
                  {pick.cast_members?.celebrity_name} & {pick.cast_members?.pro_partner}  
                </span>  
              </div>  
            ))}  
          </div>  
        </div>  
      )}  
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
  navButtonAlt: {  
    padding: '12px 20px',  
    fontSize: '1rem',  
    fontWeight: 'bold',  
    border: '2px solid #FFD700',  
    borderRadius: '12px',  
    background: 'transparent',  
    color: '#FFD700',  
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
  pickRow: {  
    display: 'flex',  
    justifyContent: 'space-between',  
    padding: '10px',  
    borderBottom: '1px solid rgba(255,255,255,0.05)',  
  },  
  pickValue: {  
    color: '#aaa',  
    fontSize: '0.9rem',  
  },  
  emptyText: {  
    color: '#888',  
    textAlign: 'center',  
    padding: '20px',  
  },  
}  
