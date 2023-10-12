import { NextFunction, Request, Response } from 'express'
import { genApiKey, validOrigin } from 'src/libs'
import {
  fetchAllProvidersByUser,
  fetchProviderKey,
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

  private createNewProvider = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user
      const { organize_name, organize_origins } = req.body

      /**
       * Validation
       */
      const errors: ErrorType = {}
      let origins: string | null = null
      if (!organize_name || (organize_name && (organize_name?.length < 3 || organize_name?.length >= 50))) {
        errors.organize_name = 'Organization name should be 3 to 49 charecters!'
      }
      if (organize_origins) {
        // errors.organize_origins = 'Organization domain required!'
        const { valid, invalid } = validOrigin(organize_origins)
        if (invalid.length) errors.organize_origins = `Invalid origins:'${invalid.join(', ')}'`
        origins = valid.join(',')
      }
      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }
      /**
       * Validation End
       */

      const provider_key = genApiKey(30) // provider access key
      const profile = await newProvider({
        user_id,
        provider_key,
        provider_name: organize_name,
        provider_origins: origins
      })
      res.json({ provider_id: profile.provider_id, provider_key, organize_name })
    } catch (error) {
      next(error)
    }
  }

  private getProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user
      const providers = await fetchAllProvidersByUser(user_id)
      res.json(providers)
    } catch (error) {
      next(error)
    }
  }

  private updateProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user
    const { providerId } = req.params
    const { origins } = req.body
    const organizeOrigins = origins.toString()

    /**
     * Validation
     */
    // const errors: ErrorType = {}
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
      const verifyProvider = await hasProvider(providerId, userId)
      if (!verifyProvider) {
        res.status(400).json({ message: 'This is not belongs to you!' })
        return
      }
      await patchProviderOrigins(valid.join(','), providerId)
      res.send({
        message: 'Origins has been updated.'
      })
    } catch (error) {
      next(error)
    }
  }

  private getProviderApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user
    const { providerId } = req.params
    if (!providerId) {
      res.status(404).send('Key not found!')
      return
    }
    try {
      const verifyProvider = await hasProvider(providerId, userId)
      if (!verifyProvider) {
        res.status(404).send('Key not found!')
        return
      }
      const { provider_key } = await fetchProviderKey(providerId)
      res.send(provider_key)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  configureRoutes() {
    // auth user
    this.router.get('/', this.isAuth, this.getProviders)
    this.router.post('/', this.isAuth, this.createNewProvider)
    this.router.patch('/:providerId', this.isAuth, this.updateProvider)
    this.router.get('/:providerId/key', this.isAuth, this.getProviderApiKey)

    // this._showRoutes()
  }
}

export default new ProviderController()