import { NextFunction, Request, Response } from 'express'
import { genApiKey, genHateoas, validOrigin } from 'src/libs'
import monitorEvent from 'src/libs/event'
import planRepo from 'src/repos/plan'
import {
  fetchAllProvidersByUser,
  fetchConsumersActivity,
  fetchConsumersByProvider,
  fetchJoinConsumersActivity,
  fetchProviderKey,
  fetchSingleProviderByUser,
  fetchSingleProviderStatics,
  hasProvider,
  newProvider,
  patchProviderOrigins
} from 'src/repos/provider'
import { ErrorType } from 'src/types/custom'
import BaseController from './base.controller'

class ProviderController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  /**
   * Check provider middleware
   */
  private hasProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { providerId } = req.params
    const userId = req.user
    /**
     * Validation
     */
    if (!providerId) {
      res.status(400).json({ message: 'Provider missing!' })
      return
    }
    try {
      const verifyProvider = await hasProvider(providerId, userId)
      if (!verifyProvider) {
        res.status(404).json({ message: 'Provider not found!' })
        return
      }
      next()
    } catch (error) {
      next(error)
    }
  }

  private createNewProvider = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user
      const { organize_name, organize_domains, plan_id } = req.body

      /**
       * Validation
       */
      const errors: ErrorType = {}
      let origins: string | null = null
      if (!organize_name || (organize_name && (organize_name?.length < 3 || organize_name?.length >= 50))) {
        errors.organize_name = 'Organization name should be 3 to 49 charecters!'
      }
      if (!plan_id) {
        errors.plan = 'Please choose any subscription!'
      }
      if (organize_domains) {
        // errors.organize_domains = 'Organization domain required!'
        const { valid, invalid } = validOrigin(organize_domains)
        if (invalid.length) errors.organize_domains = `Invalid origins:'${invalid.join(', ')}'`
        origins = valid.join(',')
      }
      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }

      const check = await planRepo.isActive(plan_id)
      if (!check) {
        res.status(404).send({
          message: 'Subscription not found!'
        })
        return
      }
      /**
       * Validation End
       */

      const api_key = genApiKey(30) // provider access key

      const profile = await newProvider({
        plan_id,
        user_id,
        api_key,
        organize_name: organize_name,
        organize_domains: origins
      })
      res.json({ provider_id: profile.provider_id, api_key, organize_name })
    } catch (error) {
      next(error)
    }
  }

  private getProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user
      const providers = await fetchAllProvidersByUser(user_id)
      const _links = genHateoas({ 'create-provider': '' }, { req })
      res.json({ data: providers, _links })
    } catch (error) {
      next(error)
    }
  }

  private getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { providerId } = req.params
    try {
      const profile = await fetchSingleProviderByUser(providerId)
      if (!profile) {
        res.status(404).json({ message: 'Provider not found!' })
        return
      }
      const statics = await fetchSingleProviderStatics(providerId)
      const [activity, joined] = await Promise.all([
        fetchConsumersActivity(providerId),
        fetchJoinConsumersActivity(providerId)
      ])

      const _links = genHateoas(
        { 'update-domains': '', users: 'users', 'show-key (Deprecated)': 'key', plan: 'plans' },
        { req }
      )

      res.json({ data: { ...profile, ...statics[0], consumers: { activity, joined } }, _links })
    } catch (error) {
      next(error)
    }
  }

  private updateDomains = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // const userId = req.user
    const { providerId } = req.params
    const { domains } = req.body
    const organizeOrigins = domains.toString()

    /**
     * Validation
     */
    if (!providerId) {
      res.status(400).json({ message: 'Provider missing!' })
      return
    }
    if (!organizeOrigins) {
      res.status(400).json({ message: 'Organization domain required with full [http/https] protocol!' })
      return
    }
    const { valid, invalid } = validOrigin(organizeOrigins)
    if (invalid.length) {
      res.status(400).json({ message: 'Required with full [http/https] protocol!', valid, invalid })
      return
    }

    try {
      // const verifyProvider = await hasProvider(providerId, userId)
      // if (!verifyProvider) {
      //   res.status(400).json({ message: 'This is not belongs to you!' })
      //   return
      // }
      await patchProviderOrigins(valid.join(','), providerId)
      res.send({
        message: 'Origins has been updated.'
      })
    } catch (error) {
      next(error)
    }
  }

  private getApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // const userId = req.user
    const { providerId } = req.params
    if (!providerId) {
      res.status(404).send('Key not found!')
      return
    }
    try {
      // const verifyProvider = await hasProvider(providerId, userId)
      // if (!verifyProvider) {
      //   res.status(404).send('Key not found!')
      //   return
      // }
      const { api_key } = await fetchProviderKey(providerId)
      monitorEvent.notify('info', 'Someone access to show provider api key')
      res.send(api_key)
    } catch (error) {
      next(error)
    }
  }

  private getConsumers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { providerId } = req.params
    const {} = req.body
    const { page, limit } = req.query
    try {
      const users = await fetchConsumersByProvider(providerId, true, +limit || 10, +page || 0)

      const _links = [{ rel: 'self', href: `/providers/${providerId}/users` }]

      res.json({ data: users.map((u) => u.users), _links })
    } catch (error) {
      next(error)
    }
  }

  private getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { providerId } = req.params
    try {
      const users = await fetchConsumersByProvider(providerId)

      const _links = [{ rel: 'self', href: `/providers/${providerId}/users` }]

      res.json({ data: users.map((u) => u.users), _links })
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public configureRoutes() {
    // auth user
    this.router.get('/', this.isAuth(['provider']), this.getProviders)
    this.router.post('/', this.isAuth(['provider']), this.createNewProvider)
    this.router.get('/:providerId', this.isAuth(['provider']), this.hasProvider, this.getDashboard)
    this.router.patch('/:providerId', this.isAuth(['provider']), this.hasProvider, this.updateDomains)
    this.router.get('/:providerId/key', this.isAuth(['provider']), this.hasProvider, this.getApiKey)
    this.router.get('/:providerId/users', this.isAuth(['provider']), this.hasProvider, this.getConsumers)
    this.router.get('/:providerId/plan', this.isAuth(['provider']), this.hasProvider, this.getPlan)

    // this._showRoutes()
  }
}

export default new ProviderController()
