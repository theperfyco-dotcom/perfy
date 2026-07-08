import { getYouTubeReviews } from '@/lib/youtube'
import YouTubeGrid from './YouTubeGrid'
import styles from './YouTubeGrid.module.css'

interface Props {
  fragranceId:   string
  fragranceName: string
  brandName:     string
}

export default async function YouTubeReviews({ fragranceId, fragranceName, brandName }: Props) {
  const videos = await getYouTubeReviews(fragranceId, fragranceName, brandName)
  if (!videos.length) return null
  return (
    <section className={styles.section} aria-labelledby="yt-heading">
      <YouTubeGrid videos={videos} fragranceName={fragranceName} />
    </section>
  )
}
