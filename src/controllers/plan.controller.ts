import { NextFunction, Request, Response } from 'express'
import planRepo from 'src/repos/plan'
import { ErrorType } from 'src/types/custom'
import BaseController from './base.controller'

class PlanController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  private getPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // const userId = req.user
      // console.log('hasOwner :', hasOwner)
      // if (!hasOwner) return next()
      const plans = await planRepo.gets()
      res.json(plans)
    } catch (error) {
      next(error)
    }
  }

  private createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const user_id = req.user
      const { name, description, features, planlimit } = req.body

      /**
       * Validation
       */
      const errors: ErrorType = {}
      if (!name) errors.name = 'Plan name is required!'
      if (!description) errors.description = 'Plan description is required!'
      if (!planlimit) {
        errors.planlimit = 'Plan limit is required!'
      } else {
        if (planlimit < 10 || planlimit > 1000) {
          errors.planlimit = 'Plan limit must be between 10 to 1000!'
        }
      }

      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }

      /**
       * Validation End
       */

      const subscription = await planRepo.save({ name, description, features, plan_limit: planlimit })
      res.json(subscription)
    } catch (error) {
      next(error)
    }
  }

  private updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // const userId = req.user
      const { planId } = req.params
      const { name, description, features, planlimit } = req.body
      /**
       * validation
       */
      if (!planId) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      // if (subscription_name.length < 3) {
      //   res.status(400).send({
      //     subscription_name: 'Subscription name should be more then 3 cherecters!'
      //   })
      //   return
      // }
      const check = await planRepo.isActive(planId)
      if (!check) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      const update = await planRepo.update({ name, description, features, plan_limit: planlimit }, planId)
      res.json(update)
    } catch (error) {
      next(error)
    }
  }

  private updatePlanActivation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // const userId = req.user
      const { planId } = req.body
      /**
       * validation
       */
      if (!planId) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      const check = await planRepo.isActive(planId)
      if (!check) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      const update = await planRepo.patchStatus(!check.status, planId)
      res.json(update)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public configureRoutes() {
    // Plan routes

    this.router.get('/', this.isAuth(['provider', 'admin']), this.getPlans)
    this.router.post('/', this.isAuth(['admin']), this.createPlan)
    this.router.patch('/activation', this.isAuth(['admin']), this.updatePlanActivation)
    this.router.patch('/:planId', this.isAuth(['admin']), this.updatePlan)

    // this._showRoutes()
  }
}

export default new PlanController()
