import { users } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const checkUniqueUsername = (username: string) =>
  prismadb.users.findFirst({
    select: {
      user_id: true,
      email: true
    },
    where: {
      username: username?.toLowerCase()
    }
  })

export const checkUniqueEmail = (email: string) =>
  prismadb.users.findFirst({
    select: { user_id: true },
    where: {
      email: email?.toLowerCase()
    }
  })

export const userExists = (user_id: string) =>
  prismadb.users.findFirst({
    select: { user_id: true },
    where: {
      user_id
    }
  })

export const newUser = (
  body: Pick<users, 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'>,
  user_agent?: string
) =>
  prismadb.users.create({
    data: {
      ...body,
      user_activities: {
        create: {
          action: 'register',
          user_agent
        }
      }
    },
    select: {
      user_id: true,
      role: true
    }
  })

export const getUserByUsername = (username: string) =>
  prismadb.users.findFirst({
    select: { user_id: true, hashedPassword: true },
    where: {
      username: username?.toLowerCase()
    }
  })

export const getAvaterByUserId = (user_id: string) =>
  prismadb.users.findFirst({
    select: {
      avater: true
    },
    where: {
      user_id
    }
  })

export const getCurrentUser = (user_id: string) =>
  prismadb.users.findFirst({
    where: {
      user_id
    },
    select: {
      fullname: true,
      username: true,
      email: true,
      avater: true,
      role: true,
      createdAt: true
    }
  })

export const patchPassword = (hashedPassword: string, user_id: string) =>
  prismadb.users.update({
    where: {
      user_id
    },
    data: {
      hashedPassword
    }
  })

export const patchEmail = (email: string, user_id: string) =>
  prismadb.users.update({
    where: {
      user_id
    },
    data: {
      email: email?.toLowerCase()
    }
  })

export const getForgeter = (user: string) =>
  prismadb.users.findFirst({
    where: {
      isActive: true,
      OR: [{ username: user?.toLowerCase() }, { email: user?.toLowerCase() }]
    },
    select: {
      user_id: true,
      email: true,
      hashedPassword: true
    }
  })

export const getHashByUserId = (user_id: string) =>
  prismadb.users.findFirst({
    select: {
      hashedPassword: true
    },
    where: {
      user_id
    }
  })
