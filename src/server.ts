import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import useragent from 'express-useragent'
import { readFileSync } from 'fs'
import helmet from 'helmet'
import hpp from 'hpp'
import { HttpTerminator, createHttpTerminator } from 'http-terminator'
import { Server as HttpServer, createServer } from 'https'
import path, { join } from 'path'
import favicon from 'serve-favicon'
import authController from './controllers/auth.controller'
import authClientController from './controllers/authClient.controller'
import providerController from './controllers/provider.controller'
import subscriptionController from './controllers/subscription.controller'
import userController from './controllers/user.controller'
import corsOptions, { authorityCors } from './libs/cors'
import { sysLog } from './libs/logger'

// export const debugLog: debug.IDebugger = debug('app')

class ExpressServer {
  express: express.Application
  server: HttpServer
  httpTerminator: HttpTerminator

  constructor() {
    const options = {
      key: readFileSync(join('./cert/key.pem')),
      cert: readFileSync(join('./cert/cert.pem'))
    }
    this.express = express()
    this.server = createServer(options, this.express)
    this.httpTerminator = createHttpTerminator({ server: this.server })
    this._configure()
    this._routes()
    this._errorRoutes()
  }

  private _configure(): void {
    // Features
    this.express.enable('trust proxy')
    this.express.set('port', process.env.PORT || 8000)
    // Core Middlewares
    this.express.use(cors(corsOptions))
    this.express.use(helmet())
    this.express.use(cookieParser())
    this.express.use(compression())
    this.express.use(useragent.express())
    this.express.use(hpp())
    this.express.use(express.urlencoded({ extended: true, limit: '100kb' }))
    this.express.use(express.json({ limit: '10kb', type: 'application/json' }))
    this.express.use(express.static(path.resolve('public')))
    this.express.use(favicon(path.resolve('public', 'favicon.ico')))
  }

  private _routes(): void {
    this.express.get('/', (_req: Request, res: Response) => {
      res.send('All Ok !')
    })

    this.express.use(cors(authorityCors))
    this.express.use('/v1/auth/', authController.router)
    this.express.use('/v1/users/', userController.router)
    this.express.use('/v1/providers/', providerController.router)
    this.express.use('/v1/subscriptions/', subscriptionController.router)

    this.express.use('/v1/client/auth/', authClientController.router)

    let routePaths = []
    const stacks = this.express._router?.stack
    // console.log('stacks :', stacks[stacks.length - 1]?.handle?.stack)
    console.log('-----------------------------------')
    stacks
      ?.filter((s) => s.name === 'router')
      .forEach((stack) => {
        const innerStacks = stack?.handle.stack
        if (stack && innerStacks) {
          innerStacks.forEach((inrStack) => {
            const { methods, path } = inrStack.route
            const method = Object.keys(methods)
            // console.log('methods, path :', stack.regexp, methods, path)
            console.log('http:', method[0].toUpperCase(), path)
            routePaths.push(methods, path)
          })
          console.log('-----------------------------------')
        }
      })
  }

  private _errorRoutes(): void {
    // ERROR POINTS
    this.express.use((_req: Request, res: Response): void => {
      res.status(404).send('Not found!')
    })
    // response api errors
    this.express.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      // console.log('res.headersSent :', res.headersSent)
      if (res.headersSent) {
        return next(err)
      }
      res.status(500).send('Server not responding.')

      if (process.env.NODE_ENV !== 'production') {
        console.log('Error encountered:', err.stack || err)
      } else {
      }
      sysLog.error(err + '', { meta: req.url })
      // console.log('req.url :', req.url)
      if (err?.message === 'cors') return res.end('Not allowed by CORS')
      //   return next(err)
    })

    this.express.use((err: Error, req: Request, _res: Response) => {
      // Your error handler ...
      // sysLog.warn(err.message || err)
      sysLog.error(err + '', { meta: req.url })
      // console.log('Error XYZ:', _err.message || _err)
    })
  }

  public start(): void {
    this.server.listen(this.express.get('port'), () => {
      if (process.env.NODE_ENV !== 'production') {
        // console.clear()
        sysLog.info(`Server listening on http://localhost:${this.express.get('port')}`)
      }
    })
  }
}

export default new ExpressServer()
