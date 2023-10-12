import { providers } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const newProvider = (
  body: Omit<providers, 'provider_id' | 'createdAt' | 'isActive' | 'updatedAt' | 'deletedAt'>
) =>
  prismadb.providers.create({
    data: body,
    select: {
      provider_id: true
    }
  })

export const fetchAllProvidersByUser = (user_id: string) =>
  prismadb.providers.findMany({
    where: {
      user_id
    },
    select: {
      provider_id: true,
      provider_name: true,
      provider_origins: true
    }
  })

export const hasProvider = (provider_id: string, user_id: string) =>
  prismadb.providers.findFirst({
    where: {
      user_id,
      provider_id
    },
    select: {
      provider_id: true
    }
  })

export const patchProviderOrigins = (provider_origins: string, provider_id: string) =>
  prismadb.providers.update({
    where: {
      provider_id
    },
    data: {
      provider_origins
    },
    select: {
      provider_id: true
    }
  })

export const fetchProviderKey = (provider_id: string) =>
  prismadb.providers.findUnique({ where: { provider_id }, select: { provider_key: true } })
