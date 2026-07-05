import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { TrendUp, Diamond, Fire, CurrencyCircleDollar, Lightning, Timer, Star } from '@phosphor-icons/react/dist/ssr'
import styles from './page.module.css'

export const revalidate = 3600

const AWARD_META: Record<string, { icon: React.ReactNode; label: string; description: string; colour: string }> = {
  most_discussed:   { icon: <Fire size={18} weight="fill" />,                  label: 'Most Discussed',     description: 'Most Reddit posts & comments this month',       colour: '#E87B4A' },
  reddit_favourite: { icon: <Star size={18} weight="fill" />,                  label: "Reddit's Favourite", description: 'Highest community sentiment score',             colour: '#E8C44A' },
  hidden_gem:       { icon: <Diamond size={18} weight="fill" />,               label: 'Hidden Gem',         description: 'Glowing reviews but still under the radar',     colour: '#4AB5E8' },
  rising:           { icon: <TrendUp size={18} weight="fill" />,               label: 'Rising',             description: 'Biggest jump in mentions vs last month',        colour: '#4AE880' },
  best_value:       { icon: <CurrencyCircleDollar size={18} weight="fill" />,  label: 'Best Value',         description: 'Reddit says this punches above its price',      colour: '#9AE84A' },
  beast_mode:       { icon: <Lightning size={18} weight="fill" />,             label: 'Beast Mode',         description: 'Highest sillage signal from community reviews', colour: '#E84A4A' },
  most_longevity:   { icon: <Timer size={18} weight="fill" />,                 label: 'Longest Lasting',    description: 'Top longevity scores in Reddit reviews',        colour: '#A04AE8' },
}

interface Award {
  award_type:    string
  mention_count: number | null
  avg_sentiment: number | null
  avg_score:     number | null
  detail:        Record<string, number>
  fragrances:    { id: string; slug: string; name: string; image_url: string | null; brands: { name: string; slug: string } | null } | null
}

async function getAwards(monthStr: string): Promise<Award[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reddit_monthly_awards')
    .select(`award_type, mention_count, avg_sentiment, avg_score, detail,
      fragrances(id, slug, name, image_url, brands(name, slug))`)
    .eq('award_month', `${monthStr}-01`)
    .order('award_type')
  return (data ?? []) as unknown as Award[]
}

async function getAvailableMonths(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reddit_monthly_awards')
    .select('award_month')
    .order('award_month', { ascending: false })
  if (!data?.length) return []
  const months = [...new Set(data.map((r: { award_month: string }) => r.award_month.slice(0, 7)))]
  return months
}

function formatMonth(str: string) {
  const d = new Date(`${str}-15`)
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params  = await searchParams
  const months  = await getAvailableMonths()
  const current = params.month ?? months[0] ?? new Date().toISOString().slice(0, 7)
  const awards  = await getAwards(current)

  return (
    <main>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.eyebrow}>Monthly Awards</div>
          <h1 className={styles.title}>Reddit Fragrance Awards</h1>
          <p className={styles.sub}>
            Every month we sweep r/fragrance, r/MaleFragranceAdvice and more — extracting what the community loves, hates, and can&rsquo;t stop talking about. Generated automatically from community sentiment.
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {months.length > 1 && (
          <div className={styles.monthPicker}>
            {months.map(m => (
              <Link key={m} href={`/awards?month=${m}`}
                className={`${styles.monthBtn} ${m === current ? styles.monthBtnActive : ''}`}>
                {formatMonth(m)}
              </Link>
            ))}
          </div>
        )}

        <div className={styles.monthHeading}>
          <h2 className={styles.monthTitle}>{formatMonth(current)}</h2>
          {awards.length > 0 && <span className={styles.monthCount}>{awards.length} awards</span>}
        </div>

        {awards.length === 0 ? (
          <div className={styles.empty}>
            <p>No awards yet for {formatMonth(current)}.</p>
            <p className={styles.emptySub}>Awards are generated on the 1st of each month from the prior month&rsquo;s Reddit activity.</p>
          </div>
        ) : (
          <div className={styles.awardGrid}>
            {awards.map(award => {
              const meta = AWARD_META[award.award_type]
              const frag = award.fragrances
              if (!meta || !frag) return null

              const detail = award.detail ?? {}
              let statLine = ''
              if (award.award_type === 'most_discussed')   statLine = `${award.mention_count ?? 0} posts this month`
              if (award.award_type === 'reddit_favourite') statLine = award.avg_score ? `${Number(award.avg_score).toFixed(1)}/10 avg score` : `${Math.round((Number(award.avg_sentiment ?? 0) + 1) * 50)}% positive`
              if (award.award_type === 'hidden_gem')       statLine = `${Math.round((Number(award.avg_sentiment ?? 0) + 1) * 50)}% positive · ${award.mention_count ?? 0} posts`
              if (award.award_type === 'rising')           statLine = `+${detail.growth ?? 0} posts vs last month`
              if (award.award_type === 'best_value')       statLine = `${Number(detail.avg_price_value ?? 0).toFixed(1)}/5 value rating`
              if (award.award_type === 'beast_mode')       statLine = `${Number(detail.avg_sillage ?? 0).toFixed(1)}/5 sillage`
              if (award.award_type === 'most_longevity')   statLine = `${Number(detail.avg_longevity ?? 0).toFixed(1)}/5 longevity`

              return (
                <Link key={award.award_type} href={`/fragrance/${frag.slug}`} className={styles.awardCard}>
                  <div className={styles.awardBadge} style={{ background: meta.colour + '22', color: meta.colour }}>
                    {meta.icon}
                    <span>{meta.label}</span>
                  </div>

                  <div className={styles.awardFragrance}>
                    <div className={styles.awardImgWrap}>
                      {frag.image_url ? (
                        <Image src={frag.image_url} alt={frag.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className={styles.awardImgPlaceholder} />
                      )}
                    </div>
                    <div className={styles.awardInfo}>
                      <div className={styles.awardBrand}>{frag.brands?.name}</div>
                      <div className={styles.awardName}>{frag.name}</div>
                      <div className={styles.awardStat} style={{ color: meta.colour }}>{statLine}</div>
                    </div>
                  </div>

                  <p className={styles.awardDesc}>{meta.description}</p>
                </Link>
              )
            })}
          </div>
        )}

        <div className={styles.attribution}>
          Data sourced from public Reddit communities. Sentiment analysis powered by AI — signals are indicative, not editorial. Awards regenerate on the 1st of each month.
        </div>
      </div>
    </main>
  )
}
