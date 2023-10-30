import { Role } from '@prisma/client'
import { compare, hash } from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { sign } from 'jsonwebtoken'
import { emailReg, verifyToken } from 'src/libs'
import { genAuthToken, verifyAuthToken } from 'src/libs/jwt'
import { getLastActivity, patchActivity } from 'src/repos/activity'
import {
  checkUniqueEmail,
  checkUniqueUsername,
  clientExists,
  getCurrentUser,
  getForgeter,
  getUserByUsername,
  newUser,
  patchEmail,
  patchPassword
} from 'src/repos/client'
import resetRepo from 'src/repos/resetPassword'
import { ErrorType } from 'src/types/custom'
import { APP_ENV } from '..'
import BaseController from './base.controller'

class AuthClientController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  private register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const provider_id = res.locals?.provider_id
    try {
      // TODO: Like a create random record
      const errors: ErrorType = {}
      const { fullname, username, email, password } = req.body
      // console.log('req.body :', req.body)
      // 1st layer validation
      if (!fullname) errors.fullname = 'Fullname is required!'
      if (!username) errors.username = 'Username is required!'
      if (!email) errors.email = 'Email address is required!'
      if (!password) errors.password = 'Password is required!'
      // 2nd layer validation
      if (!errors?.fullname && fullname.length < 4) errors.fullname = 'Fullname at least 4 characters'
      if (!errors?.username && username.length < 4) errors.username = 'Username at least 4 characters'
      if (!errors?.password && password.length < 8) errors.password = 'Password should contains at least 8 characters'
      if (!errors?.email && !emailReg.test(email)) errors.email = 'Invalid email address!'

      // db check & it's called 3rd layer validation
      if (!errors.username) {
        const checkUsername = await checkUniqueUsername(username, provider_id)
        if (checkUsername) errors.username = 'Username already taken!'
      }
      if (!errors.email) {
        const checkEmail = await checkUniqueEmail(email, provider_id)
        if (checkEmail) errors.email = 'Email address already taken!'
      }

      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }
      // pass 'user' object to repository/service
      const hashedPassword = await hash(password, 12)
      // create new record and return with created "id"
      const user = await newUser(
        {
          fullname,
          username: username?.toLowerCase(),
          email: email?.toLowerCase(),
          hashedPassword,
          role: Role.USER
        },
        provider_id,
        req.useragent.source
      )

      // const [accessToken, refreshToken] = await Promise.all([
      //   signAccessToken(user?.user_id),
      //   signRefreshToken(user?.user_id)
      // ])
      const { accessToken, refreshToken } = await genAuthToken(user?.user_id, [user.role], 'https://yourdomain.com')
      // const token = sign({ aud: user?.user_id, iat: Math.floor(Date.now() / 1000) - 30 }, process.env?.JWT_SECRET, {
      //   expiresIn: '24h'
      // })
      // set token to response cookie
      // setAuthCookie(refreshToken, res)
      // response the final data
      res.json({ id: user.user_id, fullname, username, email, jwt: { accessToken, refreshToken } })
    } catch (error: any) {
      next(error)
    }
  }

  private login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const provider_id = res.locals.provider_id
    try {
      const { username, password } = req.body
      //validation
      if (!username || !password || (password && password.length < 8)) {
        res.status(400).json({ message: 'Incorrect login credentials!' })
        return
      }

      const user = await getUserByUsername(username, provider_id)
      if (!user) {
        res.status(400).json({ message: 'Incorrect login credentials!' })
        return
      }

      if (!(await compare(password, user.hashedPassword))) {
        res.status(400).json({ message: 'Incorrect login credentials!' })
        return
      }

      const { role, ...profile } = await getCurrentUser(user.user_id, provider_id)

      const action = `login`
      const [{ accessToken, refreshToken }, lastActivity] = await Promise.all([
        genAuthToken(user?.user_id, [role], 'https://yourdomain.com'),
        getLastActivity(user.user_id, action)
      ])
      /**
       * Set Activity
       */
      // const lastActivity = await getLastActivity(user.user_id, action)
      await patchActivity(
        user.user_id,
        action,
        req.useragent.source,
        req.ip,
        lastActivity?.user_activity_id,
        provider_id
      )

      // const token = sign({ aud: user?.user_id, iat: Math.floor(Date.now() / 1000) - 30 }, process.env?.JWT_SECRET, {
      //   expiresIn: '24h'
      // })
      // set token to response cookie
      // setAuthCookie(refreshToken, res)
      res.json({ id: user?.user_id, ...profile, jwt: { accessToken, refreshToken } })
    } catch (error) {
      next(error)
    }
  }

  private forget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors: ErrorType = {}
    const { user } = req.body
    const provider_id = res.locals.provider_id
    const action = `forgotPwd`
    let forgotUser: {
      email: string
      user_id: string
      hashedPassword: string
    } | null
    if (!user) errors.user = 'Username or Email address is required!'

    try {
      if (user && !errors.user) {
        forgotUser = await getForgeter(user, provider_id)
        if (!forgotUser) errors.user = 'Username or Email address is not really accosiated with this program!'
      }

      if (Object.keys(errors).length) {
        res.status(422).json(errors)
        return
      }
      let tokenId: string
      const lastActivity = await getLastActivity(forgotUser.user_id, action, provider_id)
      if (!lastActivity || lastActivity.frames <= 3) {
        const [resetTokenId] = await Promise.all([
          resetRepo.save(forgotUser.user_id, forgotUser.hashedPassword, provider_id),
          patchActivity(
            forgotUser.user_id,
            action,
            req.useragent.source,
            req.ip,
            lastActivity?.user_activity_id,
            provider_id
          )
        ])
        tokenId = resetTokenId.reset_password_id
      } else {
        res.status(422).send('You reached 3 times forgot password within an hour! try next hour.')
        return
      }

      const token = sign({ aud: forgotUser.user_id, jti: tokenId }, process.env?.JWT_SECRET, { expiresIn: '2m' })
      /**
       * Send this token to Email or other services
       */
      //----------------
      const link = `${APP_ENV.APP_URI}/v1/auth/reset-password/${token}`
      res.send({ link, token })
    } catch (error) {
      next(error)
    }
  }

  private resetPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors: ErrorType = {}
    const token = (req.body?.token || req.query?.token || req.headers['authorization']) as string
    const { new_password, confirm_password } = req.body
    const provider_id = res.locals.provider_id
    const action = `resetPwd`

    if (!token) {
      res.status(400).json({ message: 'Token is required!' })
      return
    }

    if (!new_password) errors.new_password = 'Password is required!'
    if (!errors?.new_password && new_password.length < 8)
      errors.new_password = 'Password should contains at least 8 characters'
    if (!errors?.new_password && new_password !== confirm_password)
      errors.confirm_password = 'Confirmation password not matched!'

    if (Object.keys(errors).length) {
      res.status(400).json(errors)
      return
    }

    try {
      const decoded = verifyToken(token)
      await resetRepo.verify(decoded?.jti)
      const lastActivity = await getLastActivity(decoded.aud, action, provider_id)
      if (!lastActivity || lastActivity.frames <= 3) {
        const [hashedPassword] = await Promise.all([
          hash(new_password, 12),
          patchActivity(decoded.aud, action, req.useragent.source, req.ip, lastActivity?.user_activity_id, provider_id),
          resetRepo.expire(decoded.jti)
        ])
        const patched = await patchPassword(hashedPassword, decoded.aud)
        res.send(!!patched ? 'Password has been reset.' : 'Password not reset!')
      } else {
        res.status(422).send('You reached 3 time changes password within an hour! try next hour.')
        return
      }
    } catch (error) {
      res.status(422).send('Reset token has been expired!')
    }
  }

  private refreshToken = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { token } = req.body
    const provider_id = res.locals.provider_id
    let refToken: string = token
    // console.log('refToken :', refToken)
    if (!refToken) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }
    if (refToken.toLowerCase().startsWith('bearer')) {
      refToken = refToken.slice('bearer'.length).trim()
    }
    try {
      const decode = await verifyAuthToken(refToken)
      if (!decode) {
        res.status(403).send('Invalid Token!')
        return
      }
      // console.log('decode.aud, provider_id :', decode.aud, provider_id)
      const exists = await clientExists(decode.aud, provider_id)

      if (!exists) {
        res.status(401).send('Invalid Token!')
        return
      }

      const action = `refreshToken`
      const [{ accessToken, refreshToken }, lastActivity] = await Promise.all([
        genAuthToken(decode.aud, decode.scopes, 'https://yourdomain.com'),
        getLastActivity(decode.aud, action, provider_id)
      ])
      // setAuthCookie(refreshToken, res)
      /**
       * Set Activity
       */
      // const lastActivity = await getLastActivity(aud, action)
      await patchActivity(decode.aud, action, req.useragent.source, req.ip, lastActivity?.user_activity_id, provider_id)
      // apply new tokens
      res.status(200).json({ jwt: { accessToken, refreshToken } })
    } catch (error) {
      // next(error)
      res.status(403).send('Invalid Token!')
    }
  }

  private verifyPublicAccessToken = async (req: Request, res: Response): Promise<void> => {
    let token = (req.query?.token || req.headers['authorization'] || req.headers['x-access-token']) as string

    if (!token) {
      res.status(403).send('Unauthorized!')
      return
    }
    if (token.toLowerCase().startsWith('bearer')) {
      token = token.slice('bearer'.length).trim()
    }
    // console.log('token :', token)
    try {
      // const decoded = verifyToken(token)
      const decoded = await verifyAuthToken(token)
      if (!decoded) {
        res.status(403).send('Invalid Token!')
        return
      }
      // const decoded = await verifyAccessToken(token)
      const exists = await clientExists(decoded.aud, res.locals.provider_id)

      if (!exists) {
        res.status(401).send('Invalid Token!')
        return
      }
      res.send('Authenticated.')
    } catch (err) {
      // console.log('verify ERROR :\n', err)
      res.status(401).send('Invalid Token!')
    }
  }

  private updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: ErrorType = {}
      const userId = req.user
      const { section } = req.params
      const provider_id = res.locals.provider_id

      switch (section) {
        case 'password': {
          const { old_password, new_password, confirm_password } = req.body
          // 1 # Requirements
          if (!old_password) errors.old_password = 'Old password is required!'
          if (!new_password) errors.new_password = 'New password is required!'
          if (!confirm_password) errors.confirm_password = 'Confirm password is required!'
          // 2 # Should be
          if (!errors?.new_password && new_password.length < 8)
            errors.new_password = 'Password should contains at least 8 characters!'
          if (!errors?.new_password && !errors?.old_password && old_password === new_password)
            errors.new_password = 'Try new password!'
          //
          if (Object.keys(errors).length) {
            res.status(400).json(errors)
            return
          }
          const hashedPassword = await hash(new_password, 12)
          const update = await patchPassword(hashedPassword, userId)
          res.status(!!update ? 200 : 400).send({
            message: !!update ? 'Password changed.' : 'Password not changed!'
          })
          break
        }

        case 'email': {
          const { new_email } = req.body
          // 1 # Requirements
          if (!new_email) errors.new_email = 'Email is required!'
          if (!errors?.new_email && !emailReg.test(new_email)) errors.new_email = 'Invalid email address!'
          //
          if (Object.keys(errors).length) {
            res.status(400).json(errors)
            return
          }

          if (!errors.new_email) {
            const checkEmail = await checkUniqueEmail(new_email, provider_id)
            if (checkEmail) errors.new_email = 'Email address already taken!'
          }
          //
          if (Object.keys(errors).length) {
            res.status(400).json(errors)
            return
          }

          const update = await patchEmail(new_email, userId)
          res.status(!!update ? 200 : 400).send({
            message: !!update ? 'Email address changed.' : 'Email address not changed!'
          })
          break
        }

        default:
          next()
          return
      }
      /**
       * Set Activity
       */
      const action = `${section}Change`
      const lastActive = await getLastActivity(userId, action, provider_id)
      await patchActivity(userId, action, req.useragent.source, req.ip, lastActive?.user_activity_id, provider_id)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public configureRoutes() {
    // Auth
    this.router.post('/signup', this.ensureKey, this.register)
    this.router.post('/signin', this.ensureKey, this.login)
    this.router.post('/forget-password', this.ensureKey, this.forget)
    this.router.post('/reset-password', this.ensureKey, this.resetPassword)
    this.router.post('/refresh', this.ensureKey, this.refreshToken)
    this.router.get('/verify', this.ensureKey, this.verifyPublicAccessToken)
    this.router.patch('/:section', this.ensureKey, this.isAuth(['user']), this.updateUser)

    // return this.router
    // this.showRoutes()
  }
}

export default new AuthClientController()
