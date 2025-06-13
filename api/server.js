import process from 'node:process'

import prom from '@isaacs/express-prometheus-middleware'
import { createRequestHandler } from '@react-router/express'
import compression from 'compression'
import crypto from 'crypto'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import fs from 'fs'
import i18nextMiddleware from 'i18next-http-middleware'
import morgan from 'morgan'
import path from 'path'
import serverless from 'serverless-http'

import i18n from '../app/modules/i18n/i18n.server.js'
import { parseCookies, verifyJwt } from './utils.js'
const METRICS_PORT = process.env.METRICS_PORT || 3030
const PORT = process.env.APP_PORT || 2112
const NODE_ENV = process.env.NODE_ENV ?? 'development'
const MAX_LIMIT_MULTIPLE = NODE_ENV !== 'production' ? 10_000 : 1

const viteDevServer
  = process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then(vite => vite.createServer({
        server: { middlewareMode: true }
      }))

const defaultRateLimit = {
  legacyHeaders: false,
  max: 1000 * MAX_LIMIT_MULTIPLE,
  standardHeaders: true,
  windowMs: 60 * 1000
}

const strongestRateLimit = rateLimit({
  ...defaultRateLimit,
  max: 10 * MAX_LIMIT_MULTIPLE,
  windowMs: 60 * 1000
})

const strongRateLimit = rateLimit({
  ...defaultRateLimit,
  max: 100 * MAX_LIMIT_MULTIPLE,
  windowMs: 60 * 1000
})
const generalRateLimit = rateLimit(defaultRateLimit)

const app = express()
const metricsApp = express()

// Place Vite dev server middleware first to ensure HMR works properly
if (viteDevServer) {
  app.use(viteDevServer.middlewares)
}
 else {
  app.use(
    '/assets',
    express.static('build/client/assets', {
      immutable: true,
      maxAge: '1y'
    })
  )
  app.use(express.static('build/client', { maxAge: '1h' }))
}

app.disable('x-powered-by')
app.use(compression())
app.use(morgan('tiny'))

// Prometheus
app.use(prom({
  collectDefaultMetrics: true,
  metricsApp,
  metricsPath: '/metrics'
}))

app.use((_, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
  next()
})

app.use((req, res, next) => {
  if (req.path.endsWith('/') && req.path.length > 1) {
    const query = req.url.slice(req.path.length)
    const safePath = req.path.slice(0, -1).replace(/\/+/g, '/')
    res.redirect(301, safePath + query)
  } else {
    next()
  }
})

app.use((req, res, next) => {
  const STRONG_PATHS = ['/auth/login']
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (STRONG_PATHS.some(path => req.path.includes(path))) {
      return strongestRateLimit(req, res, next)
    }
    return strongRateLimit(req, res, next)
  }
  return generalRateLimit(req, res, next)
})
app.use(i18nextMiddleware.handle(i18n))
app.use((req, res, next) => {
  req.context = { req, res, session: req.session }
  next()
})
const findServerBuild = () => {
  const serverDir = path.join(process.cwd(), 'build', 'server')
  const subdirs = fs.readdirSync(serverDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
  if (subdirs.length !== 1) {
    throw new Error('Could not uniquely identify server build directory')
  }
  return path.join(serverDir, subdirs[0].name, 'index.js')
}

const build = viteDevServer
  ? await viteDevServer.ssrLoadModule('virtual:react-router/server-build')
  : await import(findServerBuild())

app.get('/test-session', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1
  }
 else {
    req.session.views++
  }
  res.send(`Session works! You've visited ${req.session.views} times.`)
})

app.all(
  '*',
  createRequestHandler({
    build,
    mode: NODE_ENV,
    getLoadContext: async (req, res) => {
      const cookies = parseCookies(req)
      const token = cookies.token
      let user = null

      if (token) {
        const payload = verifyJwt(token)
        if (payload && payload.userId) {
          // You can fetch full user here or just pass userId
          user = { id: payload.userId }
        }
      }

      return {
        user,
        req,
        res,
        cspNonce: res.locals.cspNonce,
        i18n: {
          language: req.language || req.i18n?.language || 'en'
        }
      }
    }
  })
)

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  res.status(500).send(NODE_ENV === 'development'
    ? `<pre>${err.stack}</pre>`
    : 'Internal Server Error')
})
export const handler = serverless(app)

if (NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🤘 server running: http://localhost:${PORT}`))
  metricsApp.listen(METRICS_PORT, () => console.log(`✅ metrics ready: http://localhost:${METRICS_PORT}/metrics`))
}
