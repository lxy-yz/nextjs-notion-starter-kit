// global styles shared across the entire site
import 'styles/global.css'

// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css'

// used for rendering equations (optional)
import 'katex/dist/katex.min.css'

// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-coy.css'

// this might be better for dark mode
// import 'prismjs/themes/prism-okaidia.css'

// global style overrides for notion
import 'styles/notion.css'

// global style overrides for prism theme (optional)
import 'styles/prism-theme.css'

// import * as Fathom from 'fathom-client'
// import posthog from 'posthog-js'
import type { AppProps } from 'next/app'
// here we're bringing in any languages we want to support for
// syntax highlighting via Notion's Code block
import 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'

import React from 'react'
import { useRouter } from 'next/router'

// analytics
// import { fathomId, fathomConfig } from 'lib/config'
// import * as Fathom from 'fathom-client'
import * as gtag from '../lib/gtag'
import Script from 'next/script'

import { bootstrap } from 'lib/bootstrap-client'
import { isServer } from 'lib/config'

if (!isServer) {
  bootstrap()
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  React.useEffect(() => {
    // function onRouteChangeComplete() {
    //   if (fathomId) {
    //     Fathom.trackPageview()
    //   }

    //   if (posthogId) {
    //     posthog.capture('$pageview')
    //   }
    // }

    // if (fathomId) {
    //   Fathom.load(fathomId, fathomConfig)
    // }

    // if (posthogId) {
    //   posthog.init(posthogId, posthogConfig)
    // }

    // router.events.on('routeChangeComplete', onRouteChangeComplete)

    const onRouteChangeComplete = (url: string) => gtag.pageview(url)

    router.events.on('routeChangeComplete', onRouteChangeComplete)
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [router.events])

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy='afterInteractive'
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Script
        id='gtag-init'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `
        }}
      />
      <Component {...pageProps} />
    </>
  )
}
