import React from 'react'
import { supabase } from '../supabaseClient'

export default function Navbar({ profile }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#eee' }}>
      <div>
        <strong>YT Team Dashboard</strong>
      </div>
      <div>
        {profile && (
          <>
            <img src={profile.avatar_url} alt="avatar" width={30} style={{ borderRadius: '50%', marginRight: 10 }} />
            {profile.name} ({profile.role}) |
            <button onClick={handleLogout} style={{ marginLeft: 10 }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
