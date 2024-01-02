import {
  getBlockParentPage,
  getBlockTitle,
  getPageProperty,
  idToUuid
} from 'notion-utils'
import { ExtendedRecordMap } from 'notion-types'
import { getCanonicalPageUrl } from 'lib/map-page-url'
import { getSocialImageUrl } from 'lib/get-social-image-url'
import * as config from 'lib/config'
import type { SiteMap } from 'lib/types'

import NotionPageToHtml from 'notion-page-to-html'
import path from 'path'
import fs from 'fs'
import RSS from 'rss'
import { getSiteMap } from './get-site-map'
import { getSiteConfig } from './get-config-value'

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

export async function generateFeedItems(siteMap: SiteMap, skipCache = false) {
  const dataDir = path.join(process.cwd(), 'data')
  const fileCache = `${dataDir}/rss.json`

  const res = []
  const cache = JSON.parse(fs.readFileSync(fileCache, 'utf8'))

  for (const pagePath of Object.keys(siteMap.canonicalPageMap)) {
    const pageId = siteMap.canonicalPageMap[pagePath]
    const recordMap = siteMap.pageMap[pageId] as ExtendedRecordMap
    if (!recordMap) continue

    const keys = Object.keys(recordMap?.block || {})
    const block = recordMap?.block?.[keys[0]]?.value
    if (!block) continue

    const parentPage = getBlockParentPage(block, recordMap)

    const postsPageId = getSiteConfig('postsNotionPageId', '')
    const isBlogPost =
      block.type === 'page' &&
      block.parent_table === 'collection' &&
      parentPage?.id === idToUuid(postsPageId)
    if (!isBlogPost) {
      continue
    }

    if (cache[pageId] && !skipCache) {
      res.push(cache[pageId])
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

    let content
    try {
      const { html } = await NotionPageToHtml.convert(
        `https://notion.so/${pageId.replace(/-/g, '')}`,
        { bodyContentOnly: true }
      )
      // FIX: work around for 4.5M lambda response payload limit
      // https://vercel.com/docs/concepts/limits/overview#serverless-function-payload-size-limit
      content = html.slice(0, 500)
    } catch (err) {
      console.error(
        'NotionPageToHtml.convert error',
        err.message,
        'pageId',
        pageId
      )
    }

    const item = {
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
          'content:encoded': {
            _cdata: content
          }
        }
      ]
    }
    res.push(item)
    cache[pageId] = item
    console.log('feed item', item)
  }

  if (
    Object.keys(cache).length !== Object.keys(siteMap.canonicalPageMap).length
  ) {
    try {
      fs.writeFileSync(fileCache, JSON.stringify(cache, null, 2))
      // eslint-disable-next-line no-empty
    } catch {}
  }
  return res
}
