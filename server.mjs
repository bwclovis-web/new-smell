import process from "node:process"

import prom from "@isaacs/express-prometheus-middleware"
import { createRequestHandler } from "@react-router/express"
import compression from "compression"
import crypto from "crypto"
import express from "express"
import { rateLimit } from "express-rate-limit"
import i18nextMiddleware from "i18next-http-middleware"
import morgan from "morgan"

import i18n from "./app/modules/i18n/i18n.server.js"
const METRICS_PORT = process.env.METRICS_PORT || 3030
const PORT = process.env.APP_PORT || 2112
const NODE_ENV = process.env.NODE_ENV ?? "development"
const MAX_LIMIT_MULTIPLE = NODE_ENV !== "production" ? 10_000 : 1

const viteDevServer
  = process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then(vite => vite.createServer({
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

if (viteDevServer) {
  app.use("/assets", express.static("public/assets"))
  app.use(viteDevServer.middlewares)
}
else {
  app.use(
    "/assets",
    express.static("build/client/assets", {
      immutable: true,
      maxAge: "1y"
    })
  )
}
app.use(express.static("build/client", { maxAge: "1h" }))
app.disable("x-powered-by")
app.use(compression())
app.use(morgan("tiny"))

// Prometheus
app.use(prom({
  collectDefaultMetrics: true,
  metricsApp,
  metricsPath: "/metrics"
}))

app.use((_, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("hex")
  next()
})

app.use((req, res, next) => {
  if (req.path.endsWith("/") && req.path.length > 1) {
    const query = req.url.slice(req.path.length)
    const safePath = req.path.slice(0, -1).replace(/\/+/g, "/")
    res.redirect(301, safePath + query)
  }
  else {
    next()
  }
})

app.use((req, res, next) => {
  const STRONG_PATHS = ["/auth/login"]
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (STRONG_PATHS.some(path => req.path.includes(path))) {
      return strongestRateLimit(req, res, next)
    }
    return strongRateLimit(req, res, next)
  }
  return generalRateLimit(req, res, next)
})
app.use(i18nextMiddleware.handle(i18n))
const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
  : await import("./build/server/index.js")

app.all(
  "*",
  createRequestHandler({
    build
  })
)

app.use((err, req, res, next) => {
  console.error(err.stack)
  if (res.headersSent) return next(err)

  res.status(500).send(
    NODE_ENV === "development"
      ? `<pre>${err.stack}</pre>`
      : "Internal Server Error"
  )
})

app.listen(PORT, () => console.log(`🤘 server running: http://localhost:${PORT}`))
metricsApp.listen(METRICS_PORT, () => console.log(`✅ metrics ready: http://localhost:${METRICS_PORT}/metrics`))
