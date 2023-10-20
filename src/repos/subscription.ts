import { subscriptions } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const fetchAllSubscriptions = () =>
  prismadb.subscriptions.findMany({
    select: {
      subscription_id: true,
      title: true,
      description: true,
      planLimit: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

export const newSub = (body: Pick<subscriptions, 'title' | 'description' | 'planLimit'>) =>
  prismadb.subscriptions.create({
    data: body,
    select: {
      subscription_id: true
    }
  })

type SubPatchType = {
  title?: string
  description?: string
  planLimit?: number
  isActive?: boolean
}

export const patchSub = (data: SubPatchType, subscription_id: string) =>
  prismadb.subscriptions.update({
    where: {
      subscription_id
    },
    data,
    select: {
      subscription_id: true
    }
  })

export const checkSubActivity = (subscription_id: string) =>
  prismadb.subscriptions.findUnique({
    where: {
      subscription_id
    },
    select: {
      isActive: true
    }
  })

export const checkUniqueSub = (title: string, planLimit: number) =>
  prismadb.subscriptions.findFirst({
    where: {
      OR: [{ title }, { planLimit }]
    },
    select: {
      title: true,
      planLimit: true
    }
  })
