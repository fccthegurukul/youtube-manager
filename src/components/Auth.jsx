import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../services/supabase'
import './Auth.css'

export default function Auth({ onAuthSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLogin, setIsLogin] = useState(true) // START IN LOGIN MODE
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    const { email, password, name, phone } = formData

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setIsSubmitting(false)
      return
    }

    const user = data?.user
    if (user) {
      const avatar_url = `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          name,
          email,
          phone,
          avatar_url,
          role: 'member',
        },
      ])

      if (profileError) {
        setError(profileError.message)
      } else {
        setMessage('Signup successful! Please verify your email before logging in.')
        setIsLogin(true)
        setFormData({ name: '', email: '', password: '', phone: '' })
      }
    }

    setIsSubmitting(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    const { email, password } = formData
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      onAuthSuccess?.(data)
    }

    setIsSubmitting(false)
  }

  return (
    <motion.div className="auth-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <motion.form
        className="auth-form"
        onSubmit={isLogin ? handleLogin : handleSignup}
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <h2>{isLogin ? 'Login to your account' : 'Create an account'}</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="message">{message}</p>}

        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {!isLogin && (
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
          />
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
        </button>

        <p className="switch-text">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              setError('')
              setMessage('')
              setIsLogin(!isLogin)
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </motion.form>
    </motion.div>
  )
}
