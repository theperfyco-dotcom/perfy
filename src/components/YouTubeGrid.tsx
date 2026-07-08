'use client'

import { useState } from 'react'
import Image from 'next/image'
import { YoutubeLogo, Play, X } from '@phosphor-icons/react'
import type { YouTubeVideo } from '@/lib/youtube'
import styles from './YouTubeGrid.module.css'

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const years = Math.floor(secs / 31536000)
  const months = Math.floor(secs / 2592000)
  if (years > 0) return `${years}y ago`
  if (months > 0) return `${months}mo ago`
  return 'recently'
}

function VideoCard({ video }: { video: YouTubeVideo }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className={styles.card}>
      {playing ? (
        <div className={styles.playerWrap}>
          <button className={styles.closeBtn} onClick={() => setPlaying(false)} aria-label="Close video">
            <X size={16} weight="bold" />
          </button>
          <iframe
            className={styles.player}
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button className={styles.thumb} onClick={() => setPlaying(true)} aria-label={`Play: ${video.title}`}>
          {video.thumbnail && (
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 768px) 90vw, 340px"
              style={{ objectFit: 'cover' }}
            />
          )}
          <div className={styles.playOverlay}>
            <div className={styles.playBtn}>
              <Play size={22} weight="fill" />
            </div>
          </div>
        </button>
      )}

      <div className={styles.meta}>
        <p className={styles.title}>{video.title}</p>
        <div className={styles.sub}>
          <span className={styles.channel}>{video.channel}</span>
          <span className={styles.dot} />
          <span className={styles.age}>{timeAgo(video.published)}</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  videos:        YouTubeVideo[]
  fragranceName: string
}

export default function YouTubeGrid({ videos, fragranceName }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <YoutubeLogo size={22} weight="fill" className={styles.ytIcon} aria-hidden="true" />
        <h2 className={styles.heading} id="yt-heading">Watch <em>{fragranceName}</em> reviews</h2>
      </div>
      <p className={styles.sub}>Community reviews and recommendations from YouTube</p>
      <div className={styles.grid}>
        {videos.map(v => <VideoCard key={v.videoId} video={v} />)}
      </div>
    </div>
  )
}
