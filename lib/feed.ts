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
    // https://lxy-yz.notion.site/Posts-478547f06c27418c8bc903e7b8de7b12
    const postsPageId = '478547f06c27418c8bc903e7b8de7b12'
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
      content = html
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
      fs.writeFileSync(fileCache, JSON.stringify(cache))
      // eslint-disable-next-line no-empty
    } catch {}
  }
  return res
}
