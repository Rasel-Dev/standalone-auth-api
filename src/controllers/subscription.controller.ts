import { NextFunction, Request, Response } from 'express'
import { checkSubActivity, checkUniqueSub, fetchAllSubscriptions, newSub, patchSub } from 'src/repos/subscription'
import { ErrorType } from 'src/types/custom'
import BaseController from './base.controller'

class SubscriptionController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  private getSubscriptions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // const userId = req.user
      // console.log('hasOwner :', hasOwner)
      // if (!hasOwner) return next()
      const subscriptions = await fetchAllSubscriptions()
      res.json(subscriptions)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Subscription oparetions
   */

  private createSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const user_id = req.user
      const { title, description, planlimit } = req.body

      /**
       * Validation
       */
      const errors: ErrorType = {}
      if (!title) errors.title = 'Title is required!'
      if (!description) errors.description = 'Subscription description is required!'
      if (!planlimit) {
        errors.planlimit = 'Subscription plan limit is required!'
      } else {
        if (planlimit < 10 || planlimit > 1000) {
          errors.planlimit = 'Plan limit must be between 10 to 1000!'
        }
      }

      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }

      const check = await checkUniqueSub(title, planlimit)
      if (planlimit === check?.planLimit) errors.planlimit = 'Plan limit already in used!'
      if (title === check?.title) errors.title = 'Title already in used!'
      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }

      /**
       * Validation End
       */

      const subscription = await newSub({ title, description, planLimit: planlimit })
      res.json(subscription)
    } catch (error) {
      next(error)
    }
  }

  private updateSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // const userId = req.user
      const { subscriptionId } = req.params
      const { title, description, planlimit } = req.body
      /**
       * validation
       */
      if (!subscriptionId) {
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
      const check = await checkSubActivity(subscriptionId)
      if (!check) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      const update = await patchSub({ title, description, planLimit: planlimit }, subscriptionId)
      res.json(update)
    } catch (error) {
      next(error)
    }
  }

  private updateSubscriptionActivation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // const userId = req.user
      const { subscriptionId } = req.body
      /**
       * validation
       */
      if (!subscriptionId) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      const check = await checkSubActivity(subscriptionId)
      if (!check) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      const update = await patchSub({ isActive: !check?.isActive }, subscriptionId)
      res.json(update)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Subscription Plan oparetions
   */

  // private createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const { provider_id, sub_id, description, short_code } = req.body
  //     /**
  //      * Validation
  //      */
  //     const errors: ErrorType = {}
  //     // 1 # Requirements
  //     if (!provider_id) errors.provider_id = 'ProviderId is required!'
  //     if (!sub_id) errors.sub_id = 'SubId is required!'
  //     if (!description) errors.description = 'Description is required!'
  //     if (!short_code) errors.short_code = 'Short code is required!'
  //     // 2 # Should be
  //     if (!errors?.short_code && (short_code.length < 3 || short_code.length > 10))
  //       errors.short_code = 'Short code should be 3 to 10 cherecters!'
  //     if (!errors?.description && description.length > 150)
  //       errors.description = 'Description should be under 150 cherecters!'
  //     // 3 # Identity

  //     if (Object.keys(errors).length) {
  //       res.status(400).json(errors)
  //       return
  //     }
  //     /**
  //      * Validation End
  //      */
  //     res.send('OK')
  //   } catch (error) {
  //     next(error)
  //   }
  // }

  /**
   * configure router
   */
  configureRoutes() {
    // Subscription routes

    this.router.get('/', this.getSubscriptions)
    this.router.post('/', this.createSubscription)
    this.router.patch('/activation', this.updateSubscriptionActivation)
    this.router.patch('/:subscriptionId', this.updateSubscription)
    // Plan routes
    // this.router.post('/plan', this.isAuth, this.createPlan)

    // this._showRoutes()
  }
}

export default new SubscriptionController()
