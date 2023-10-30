import { ProvStatus, providers } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const newProvider = (
  body: Pick<providers, 'plan_id' | 'user_id' | 'api_key' | 'organize_name' | 'organize_domains'>
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
      user_id,
      deletedAt: null
    },
    select: {
      provider_id: true,
      organize_name: true,
      organize_domains: true
    }
  })

export const fetchSingleProviderByUser = (provider_id: string) =>
  prismadb.providers.findFirst({
    where: {
      provider_id,
      deletedAt: null
    },
    select: {
      provider_id: true,
      organize_name: true,
      organize_domains: true
      // subscriptions: {
      //   select: {
      //     title: true,
      //     description: true
      //   }
      // }
    }
  })

export const fetchConsumersActivity = (provider_id: string) =>
  prismadb.$queryRaw`SELECT COUNT(1)::int AS user_active, "updatedAt"::DATE FROM consumer_activities_v WHERE provider_id = ${provider_id} GROUP BY provider_id, "updatedAt"::DATE ORDER BY "updatedAt" DESC LIMIT 10`

export const fetchJoinConsumersActivity = (provider_id: string) =>
  prismadb.$queryRaw`SELECT COUNT(1)::int AS joined, "updatedAt"::DATE FROM user_activities WHERE "action" = 'register' AND provider_id = ${provider_id} GROUP BY provider_id, "updatedAt"::DATE ORDER BY "updatedAt" DESC LIMIT 10`

export const fetchSingleProviderStatics = (provider_id: string) =>
  prismadb.$queryRaw<
    Record<string, number | boolean>[]
  >`SELECT "status", total_consume::int, plan_limit, usage_percent::int FROM providers_v WHERE provider_id = ${provider_id}`

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
      status: ProvStatus.ACTIVE
    },
    select: {
      provider_id: true
    }
  })

export const fetchConsumersByProvider = (provider_id: string, isActive = true, take = 10, skip = 0) =>
  prismadb.consumers.findMany({
    where: {
      provider_id,
      isActive
    },
    select: {
      users: {
        select: {
          user_id: true,
          fullname: true,
          username: true,
          email: true,
          createdAt: true
        }
      }
    },
    take,
    skip,
    orderBy: {
      users: {
        user_id: 'desc'
      }
    }
  })
