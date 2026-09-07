import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function History() {  
  const [weeks, setWeeks] = useState([])

  useEffect(() => {  
    fetchWeeks()  
  }, [])

  async function fetchWeeks() {  
    const { data } = await supabase  
      .from('weekly_sets')  
      .select('*')  
      .order('week_number', { ascending: false })  
    if (data) setWeeks(data)  
  }

  return (  
    <div style={styles.container}>  
      <Link href="/">  
        <p style={styles.backLink}>← Back to Home</p>  
      </Link>  
      <h1 style={styles.title}>📅 Past Weeks</h1>  
      {weeks.length === 0 ? (  
        <div style={styles.card}>  
          <p style={styles.emptyText}>No weeks yet! The admin will add weekly questions.</p>  
        </div>  
      ) : (  
        weeks.map((week) => (  
          <Link key={week.id} href={`/weekly/${week.id}`}>  
            <div style={styles.weekCard}>  
              <div style={styles.weekInfo}>  
                <h3 style={styles.weekTitle}>Week {week.week_number}</h3>  
                <p style={styles.weekTheme}>{week.theme || 'Weekly Questions'}</p>  
              </div>  
              <div>  
                {week.is_active ? (  
                  <span style={styles.activeBadge}>🟢 Active</span>  
                ) : week.is_graded ? (  
                  <span style={styles.gradedBadge}>✅ Graded</span>  
                ) : (  
                  <span style={styles.closedBadge}>🔒 Closed</span>  
                )}  
              </div>  
            </div>  
          </Link>  
        ))  
      )}  
    </div>  
  )  
}

const styles = {  
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', minHeight: '100vh' },  
  backLink: { color: '#FFD700', marginBottom: '20px', cursor: 'pointer' },  
  title: { fontSize: '2rem', textAlign: 'center', marginBottom: '25px', color: '#FFD700' },  
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' },  
  weekCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },  
  weekInfo: { flex: 1 },  
  weekTitle: { fontSize: '1.2rem', marginBottom: '4px' },  
  weekTheme: { color: '#aaa', fontSize: '0.9rem' },  
  activeBadge: { color: '#4CAF50', fontWeight: 'bold' },  
  gradedBadge: { color: '#FFD700', fontWeight: 'bold' },  
  closedBadge: { color: '#888' },  
  emptyText: { color: '#888', textAlign: 'center' },  
}  
