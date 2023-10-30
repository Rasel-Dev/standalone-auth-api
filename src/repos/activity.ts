import { dateTime } from 'src/libs/datetime'
import prismadb from 'src/libs/prismadb'
import { EmptyType } from 'src/types/custom'

export const newActivity = (user_id: string, action: string, user_agent?: string, provider_id?: string) =>
  prismadb.user_activities.create({
    data: {
      user_id,
      provider_id,
      action,
      user_agent
    },
    select: {
      createdAt: true
    }
  })

export const patchActivity = (
  user_id: string,
  action: string,
  user_agent?: string,
  user_ip?: string,
  user_activity_id?: string,
  provider_id?: string
) => {
  const { now } = dateTime()
  return prismadb.user_activities.upsert({
    where: {
      user_activity_id: user_activity_id || 'abcd'
    },
    update: {
      frames: {
        increment: 1
      },
      updatedAt: new Date(now)
    },
    create: {
      user_id,
      provider_id,
      action,
      user_agent,
      user_ip,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    },
    select: {
      createdAt: true
    }
  })
}

export const getLastActivity = (user_id: string, action: string, provider_id?: string) => {
  const { sub } = dateTime()
  const afterLastHour = sub({ hour: 1 })
  const where: EmptyType = { user_id, action }

  if (provider_id) where.provider_id = provider_id

  return prismadb.user_activities.findFirst({
    where: {
      ...where,
      createdAt: {
        // new Date() creates date with current time and day and etc.
        gte: new Date(afterLastHour)
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
      user_activity_id: true,
      user_agent: true,
      frames: true
    }
  })
}

export const fetchActivities = (user_id: string, limit = 10) =>
  prismadb.user_activities.findMany({
    where: { user_id },
    select: {
      user_activity_id: true,
      action: true,
      user_agent: true,
      createdAt: true
    },
    take: limit,
    orderBy: {
      createdAt: 'desc'
    }
  })
