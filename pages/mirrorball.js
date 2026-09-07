import { useState, useEffect } from 'react'  
import { supabase } from '../lib/supabase'  
import Link from 'next/link'

export default function Mirrorball() {  
  const [friends, setFriends] = useState([])  
  const [castMembers, setCastMembers] = useState([])  
  const [selectedFriend, setSelectedFriend] = useState('')  
  const [selectedCast, setSelectedCast] = useState('')  
  const [message, setMessage] = useState('')  
  const [existingPicks, setExistingPicks] = useState([])

  useEffect(() => {  
    fetchData()  
  }, [])

  async function fetchData() {  
    const { data: friendsData } = await supabase.from('friends').select('*').order('name')  
    const { data: castData } = await supabase.from('cast_members').select('*').eq('is_eliminated', false).order('celebrity_name')  
    const { data: picksData } = await supabase  
      .from('mirrorball_picks')  
      .select('*, friends(name), cast_members(celebrity_name, pro_partner)')  
      
    if (friendsData) setFriends(friendsData)  
    if (castData) setCastMembers(castData)  
    if (picksData) setExistingPicks(picksData)  
  }

  async function submitPick() {  
    if (!selectedFriend || !selectedCast) {  
      setMessage('Please select both your name and your pick!')  
      return  
    }

    const existing = existingPicks.find(p => p.friend_id === parseInt(selectedFriend))  
      
    if (existing) {  
      const { error } = await supabase  
        .from('mirrorball_picks')  
        .update({ cast_member_id: parseInt(selectedCast) })  
        .eq('friend_id', parseInt(selectedFriend))  
        
      if (error) {  
        setMessage('Error updating pick: ' + error.message)  
      } else {  
        setMessage('✅ Your mirrorball pick has been updated!')  
        fetchData()  
      }  
    } else {  
      const { error } = await supabase  
        .from('mirrorball_picks')  
        .insert([{ friend_id: parseInt(selectedFriend), cast_member_id: parseInt(selectedCast) }])  
        
      if (error) {  
        setMessage('Error submitting pick: ' + error.message)  
      } else {  
        setMessage('✅ Your mirrorball pick has been submitted!')  
        fetchData()  
      }  
    }  
  }

  return (  
    <div style={styles.container}>  
      <Link href="/">  
        <p style={styles.backLink}>← Back to Home</p>  
      </Link>

      <h1 style={styles.title}>🪩 Mirrorball Pick</h1>  
      <p style={styles.subtitle}>Who do you think will win it all?</p>  
      <p style={styles.info}>Worth 10 bonus points if correct! You can change your pick anytime before the finale.</p>

      <div style={styles.card}>  
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

        <div style={styles.formGroup}>  
          <label style={styles.label}>Your Mirrorball Pick:</label>  
          <select  
            style={styles.select}  
            value={selectedCast}  
            onChange={(e) => setSelectedCast(e.target.value)}  
          >  
            <option value="">-- Select a couple --</option>  
            {castMembers.map(c => (  
              <option key={c.id} value={c.id}>  
                {c.celebrity_name} & {c.pro_partner}  
              </option>  
            ))}  
          </select>  
        </div>

        <button style={styles.submitButton} onClick={submitPick}>  
          Submit Pick 🪩  
        </button>

        {message && <p style={styles.message}>{message}</p>}  
      </div>

      {existingPicks.length > 0 && (  
        <div style={styles.section}>  
          <h2 style={styles.sectionTitle}>Everyone's Picks</h2>  
          <div style={styles.card}>  
            {existingPicks.map((pick) => (  
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
    marginBottom: '5px',  
  },  
  info: {  
    textAlign: 'center',  
    color: '#888',  
    fontSize: '0.85rem',  
    marginBottom: '25px',  
  },  
  card: {  
    backgroundColor: 'rgba(255,255,255,0.05)',  
    borderRadius: '12px',  
    padding: '20px',  
    border: '1px solid rgba(255,255,255,0.1)',  
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
  submitButton: {  
    width: '100%',  
    padding: '14px',  
    fontSize: '1.1rem',  
    fontWeight: 'bold',  
    border: 'none',  
    borderRadius: '12px',  
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',  
    color: '#000',  
    cursor: 'pointer',  
  },  
  message: {  
    textAlign: 'center',  
    marginTop: '15px',  
    color: '#4CAF50',  
    fontWeight: 'bold',  
  },  
  section: {  
    marginBottom: '25px',  
  },  
  sectionTitle: {  
    fontSize: '1.3rem',  
    marginBottom: '10px',  
    color: '#FFD700',  
  },  
  pickRow: {  
    display: 'flex',  
    justifyContent: 'space-between',  
    padding: '10px',  
    borderBottom: '1px solid rgba(255,255,255,0.05)',  
  },  
  playerName: {  
    fontWeight: '500',  
  },  
  pickValue: {  
    color: '#aaa',  
    fontSize: '0.9rem',  
  },  
}  
