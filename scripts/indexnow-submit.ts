// scripts/indexnow-submit.ts
// Submits every sitemap URL to IndexNow (Bing, DuckDuckGo, Seznam, Yandex —
// and Bing feeds ChatGPT search). Run after significant content changes.
//
// Run: npx tsx scripts/indexnow-submit.ts

const HOST = 'perfy.io'
const KEY  = '08db867a59771872302889e073dfe6a4'

async function main() {
  const res = await fetch(`https://${HOST}/sitemap.xml`)
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  console.log(`${urls.length} URLs from sitemap`)

  // IndexNow accepts up to 10,000 URLs per POST
  for (let i = 0; i < urls.length; i += 10000) {
    const batch = urls.slice(i, i + 10000)
    const post = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: batch,
      }),
    })
    console.log(`batch ${i / 10000 + 1}: HTTP ${post.status} (${batch.length} URLs)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
