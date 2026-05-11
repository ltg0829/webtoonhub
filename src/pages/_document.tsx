import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="description" content="모든 웹툰 플랫폼을 하나에서 — 웹툰허브" />
        <meta property="og:title" content="웹툰허브" />
        <meta property="og:description" content="네이버·카카오·레진 등 모든 플랫폼 웹툰을 한 곳에서 탐색하세요" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
