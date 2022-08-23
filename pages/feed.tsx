import RSS from 'rss'
import type { GetServerSideProps } from 'next'

import * as config from 'lib/config'
import { getSiteMap } from 'lib/get-site-map'
import { generateFeedItems } from 'lib/feed'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const siteMap = await getSiteMap()
  // const ttlMinutes = 24 * 60 // 24 hours
  // const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    // ttl: ttlMinutes
  });


  (await generateFeedItems(siteMap)).forEach(item => feed.item(item))
  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    'public, max-age=0, must-revalidate'
    // `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(feedText)
  res.end()

  return { props: {} }
}


export default () => null
