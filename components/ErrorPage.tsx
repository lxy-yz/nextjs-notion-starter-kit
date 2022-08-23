import * as React from 'react'
import { NextPage } from 'next'
import { PageHead } from './PageHead'

import styles from './styles.module.css'

export const ErrorPage: NextPage<{ statusCode: number }> = ({ statusCode }) => {
  const title = 'Error'

  return (
    <>
      <PageHead title={title} />

      <div className={styles.container}>
        <main className={styles.main}>
          <h1>Error Loading Page</h1>

          {statusCode && <p>Error code: {statusCode}</p>}

          <img src='/error.png' alt='Error' className={styles.errorImage} />
        </main>
      </div>
    </>
  )
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404

  console.log('res', res, 'error', err);

  return { statusCode }
}