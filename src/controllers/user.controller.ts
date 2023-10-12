import { NextFunction, Request, Response } from 'express'
import { fetchActivities } from 'src/repos/activity'
import { getCurrentUser } from 'src/repos/user'
import BaseController from './base.controller'

class UserController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  private profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user
      const profile = await getCurrentUser(userId)
      res.json({ id: userId, ...profile })
    } catch (error) {
      next(error)
    }
  }

  private getActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user
      const activities = await fetchActivities(userId)
      res.json(activities)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  configureRoutes() {
    // auth user
    this.router.get('/', this.isAuth, this.profile)
    this.router.get('/activities', this.isAuth, this.getActivities)

    // this._showRoutes()
  }
}

export default new UserController()
