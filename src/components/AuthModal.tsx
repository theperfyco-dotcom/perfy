'use client'
import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import styles from './AuthModal.module.css'

export default function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAuth()
  const [mode, setMode]         = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  if (!authModalOpen) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { error: err } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.')
      setMode('signin')
    }
    // On successful signin, AuthProvider closes the modal via onAuthStateChange
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Sign in" onClick={e => { if (e.target === e.currentTarget) closeAuthModal() }}>
      <div className={styles.panel}>
        <button className={styles.close} aria-label="Close" onClick={closeAuthModal}>
          <X weight="bold" size={16} />
        </button>

        <div className={styles.logo}>Perf<em>y</em></div>
        <h2 className={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Join Perfy'}</h2>
        <p className={styles.sub}>
          {mode === 'signin'
            ? 'Sign in to rate fragrances and track your collection.'
            : 'Create a free account to start rating fragrances.'}
        </p>

        <form onSubmit={submit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className={styles.input}
              placeholder="you@example.com"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.input}
              placeholder={mode === 'signup' ? 'Min. 6 characters' : ''}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={`btn-primary ${styles.submit}`} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }} className={styles.toggleBtn}>
            {mode === 'signin' ? 'Join free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
