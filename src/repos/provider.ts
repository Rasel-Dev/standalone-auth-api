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
      organize_name: true,
      organize_domains: true
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

export const patchProviderOrigins = (organize_domains: string, provider_id: string) =>
  prismadb.providers.update({
    where: {
      provider_id
    },
    data: {
      organize_domains
    },
    select: {
      provider_id: true
    }
  })

export const fetchProviderKey = (provider_id: string) =>
  prismadb.providers.findUnique({ where: { provider_id }, select: { api_key: true } })

export const verifyApiKey = (api_key: string) =>
  prismadb.providers.findUnique({
    where: {
      api_key,
      isActive: true
    },
    select: {
      provider_id: true
    }
  })
