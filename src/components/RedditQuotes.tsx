import { RedditLogo, ArrowUpRight, ThumbsUp } from '@phosphor-icons/react/dist/ssr'
import type { RedditQuote } from '@/lib/db'
import styles from './RedditQuotes.module.css'

// Real excerpts from public Reddit discussions, attributed and linked to the
// source thread. This is the community data behind the seeded ratings.

interface Props {
  quotes: RedditQuote[]
}

export default function RedditQuotes({ quotes }: Props) {
  if (!quotes.length) return null

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <RedditLogo size={18} weight="fill" className={styles.icon} aria-hidden="true" />
        <span className={styles.label}>What Reddit says</span>
      </div>
      <div className={styles.list}>
        {quotes.map(q => (
          <a
            key={q.id}
            href={`https://www.reddit.com/r/${q.subreddit}/comments/${q.post_id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <p className={styles.excerpt}>&ldquo;{q.excerpt}&rdquo;</p>
            <div className={styles.meta}>
              <span className={styles.sub}>r/{q.subreddit}</span>
              {q.upvotes > 0 && (
                <span className={styles.votes}>
                  <ThumbsUp size={11} weight="fill" aria-hidden="true" /> {q.upvotes}
                </span>
              )}
              <span className={styles.read}>
                Read thread <ArrowUpRight size={11} weight="bold" aria-hidden="true" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
