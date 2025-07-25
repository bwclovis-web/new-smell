import { PassThrough } from 'node:stream'

import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

import { NonceProvider } from '~/hooks/use-nonce'
import i18n from '~/modules/i18n/i18n.server'
export const streamTimeout = 5_000

// eslint-disable-next-line max-params
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    const language = (loadContext as any).i18n?.language ?? 'en'
    const cspNonce = (loadContext as any).cspNonce
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')
    const readyOption: keyof RenderToPipeableStreamOptions
      = (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? 'onAllReady'
        : 'onShellReady'

    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={cspNonce}>
        <I18nextProvider i18n={i18n.cloneInstance({ lng: language })}>
          <ServerRouter context={routerContext} url={request.url} />
        </I18nextProvider>
      </NonceProvider>,
      {
        nonce: cspNonce,
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)
          responseHeaders.set('Content-Type', 'text/html')
          resolve(new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode
          }))
          pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            // eslint-disable-next-line no-console
            console.error(error) // TODO: Handle error
          }
        }
      }
    )
    setTimeout(abort, streamTimeout + 1000)
  })
}
