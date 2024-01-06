import fs from 'fs'
import RSS from 'rss'
import * as config from 'lib/config'
import { getSiteMap } from './get-site-map'
import { generateFeedItems } from './feed'

main().catch(console.error)

async function main() {
  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language
    // ttl: ttlMinutes
  })

  const siteMap = await getSiteMap()
  ;(await generateFeedItems(siteMap)).forEach((item) => feed.item(item))

  const xml = feed.xml({ indent: true })
  fs.writeFileSync('public/feed.xml', xml)
}
