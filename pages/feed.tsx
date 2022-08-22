import RSS from 'rss'
import type { GetServerSideProps } from 'next'
import {
  getBlockParentPage,
  getBlockTitle,
  getPageProperty,
  idToUuid
} from 'notion-utils'
import { ExtendedRecordMap } from 'notion-types'

import * as config from 'lib/config'
import { getSiteMap } from 'lib/get-site-map'
import { getCanonicalPageUrl } from 'lib/map-page-url'
import { getSocialImageUrl } from 'lib/get-social-image-url'

import NotionPageToHtml from 'notion-page-to-html';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const siteMap = await getSiteMap()
  const ttlMinutes = 24 * 60 // 24 hours
  const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    ttl: ttlMinutes
  })

  for (const pagePath of Object.keys(siteMap.canonicalPageMap)) {
    const pageId = siteMap.canonicalPageMap[pagePath]
    const recordMap = siteMap.pageMap[pageId] as ExtendedRecordMap
    if (!recordMap) continue

    const keys = Object.keys(recordMap?.block || {})
    const block = recordMap?.block?.[keys[0]]?.value
    if (!block) continue

    const parentPage = getBlockParentPage(block, recordMap)
    const postsPageId = '478547f06c27418c8bc903e7b8de7b12'
    const isBlogPost =
      block.type === 'page' &&
      block.parent_table === 'collection' &&
      parentPage?.id === idToUuid(postsPageId)
    if (!isBlogPost) {
      continue
    }

    const title = getBlockTitle(block, recordMap) || config.name
    const description =
      getPageProperty<string>('Description', block, recordMap) ||
      config.description
    const url = getCanonicalPageUrl(config.site, recordMap)(pageId)
    const lastUpdatedTime = getPageProperty<number>(
      'Last Updated',
      block,
      recordMap
    )
    const publishedTime = getPageProperty<number>('Published', block, recordMap)
    const date = lastUpdatedTime
      ? new Date(lastUpdatedTime)
      : publishedTime
        ? new Date(publishedTime)
        : undefined
    const socialImageUrl = getSocialImageUrl(pageId)

    let content;
    try {
      const { html } = await NotionPageToHtml.convert(`https://notion.so/${pageId.replaceAll('-', '')}`, { bodyContentOnly: true });
      content = html;
    } catch (err) {
      console.error('NotionPageToHtml.convert error', err.message)
    }

    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
          url: socialImageUrl,
          type: 'image/jpeg'
        }
        : undefined,

      custom_elements: [
        {
          "content:encoded":
          {
            _cdata: content
          }
        }
      ]
    })
  }

  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(feedText)
  res.end()

  return { props: {} }
}

export default () => null
