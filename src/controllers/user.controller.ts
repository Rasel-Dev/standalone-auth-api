import { NextFunction, Request, Response } from 'express'
import { genHateoas } from 'src/libs'
import { fetchActivities } from 'src/repos/activity'
import userRepo from 'src/repos/user'
import BaseController from './base.controller'

class UserController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  private profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user
      const profile = await userRepo.getProfile(userId)
      const _links = genHateoas({ activity: 'activities' }, { req })
      res.json({ id: userId, ...profile, _links })
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
  public configureRoutes() {
    // auth user
    this.router.get('/', this.isAuth(['provider', 'user']), this.profile)
    this.router.get('/activities', this.isAuth(['provider', 'user']), this.getActivities)

    // this._showRoutes()
  }
}

export default new UserController()
