import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import './Navbar.css'

export default function Navbar({ profile }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const hamburgerRef = useRef(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const toggleMenu = () => {
    setMenuOpen(prev => !prev)
  }

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)
      ) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-title">
          <span className="brand-name">🎬 FCC The Gurukul</span>
          <span className="product-badge">YouTube Team Dashboard</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Desktop user info */}
        <div className="user-info-desktop">
          {profile && (
            <>
              <img src={profile.avatar_url} alt="avatar" className="navbar-avatar" />
              <div className="navbar-user-info">
                <span className="navbar-name">{profile.name}</span>
                <span className={`navbar-role ${profile.role}`}>{profile.role}</span>
              </div>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>

        {/* Hamburger button */}
        <button
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
          type="button"
        >
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
        </button>

        {/* Dropdown menu */}
        {menuOpen && profile && (
          <div className="dropdown-menu" ref={dropdownRef}>
            <div className="dropdown-user-info">
              <img src={profile.avatar_url} alt="avatar" className="navbar-avatar" />
              <div>
                <div className="navbar-name">{profile.name}</div>
                <div className={`navbar-role ${profile.role}`}>{profile.role}</div>
              </div>
            </div>
            <button className="logout-button dropdown-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
