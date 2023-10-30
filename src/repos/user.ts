import { Prisma, users } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'
import prismadb from 'src/libs/prismadb'

class UserRepository {
  private user: Prisma.usersDelegate<DefaultArgs>
  constructor() {
    this.user = prismadb.users
  }

  /**
   * Check unique username/email
   * @param input This should be username or email address
   * @param
   */
  public hasUnique(input: string, filterBy: 'username' | 'email' = 'username') {
    if (!['username', 'email'].includes(filterBy)) {
      return null
    }
    return filterBy === 'username'
      ? this.user.findFirst({
          select: {
            user_id: true,
            email: true
          },
          where: {
            username: input?.toLowerCase()
          }
        })
      : this.user.findFirst({
          select: { user_id: true },
          where: {
            email: input?.toLowerCase()
          }
        })
  }

  /**
   * Check userId exist or not
   * @param user_id string
   */
  public isExists(user_id: string) {
    return this.user.findFirst({
      select: { user_id: true },
      where: {
        user_id,
        isActive: true
      }
    })
  }

  /**
   * This will save the new user
   * @param body This should be object of user info
   * E.g. : 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'
   * @param user_agent Not mendatory
   */
  public save(body: Pick<users, 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'>, user_agent?: string) {
    return this.user.create({
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
  }

  /**
   * This method used to get login information
   * @param input This input should be username or email
   * @param filterBy Default: 'both', Options: 'username' | 'email' | 'both'
   */
  public getIdentify(input: string, withEmail = false, filterBy: 'username' | 'email' | 'both' = 'both') {
    const userInput = input?.toLowerCase()
    const select = { user_id: true, email: true, hashedPassword: true }
    let where: any = { isActive: true, OR: [{ username: userInput }, { email: userInput }] }

    if (withEmail) delete select.email
    if (filterBy === 'username') where = { isActive: true, username: userInput }
    if (filterBy === 'email') where = { isActive: true, email: userInput }

    return this.user.findFirst({ select, where })
  }

  /**
   * Get user information
   * @param user_id string
   */
  public getProfile(user_id: string) {
    return this.user.findFirst({
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
  }

  /**
   * Update user password or email address
   * @param input Should be email or hashedPassword
   * @param user_id Who changed
   * @param filterBy 'email' | 'hashedPwd'
   */
  public patch(input: string, user_id: string, filterBy: 'email' | 'hashedPwd') {
    const data = filterBy === 'hashedPwd' ? { hashedPassword: input } : { email: input?.toLowerCase() }
    return this.user.update({ where: { user_id }, data })
  }
}

export default new UserRepository()

// export const checkUniqueUsername = (username: string) =>
//   prismadb.users.findFirst({
//     select: {
//       user_id: true,
//       email: true
//     },
//     where: {
//       username: username?.toLowerCase()
//     }
//   })

// export const checkUniqueEmail = (email: string) =>
//   prismadb.users.findFirst({
//     select: { user_id: true },
//     where: {
//       email: email?.toLowerCase()
//     }
//   })

// export const userExists = (user_id: string) =>
//   prismadb.users.findFirst({
//     select: { user_id: true },
//     where: {
//       user_id
//     }
//   })

// export const newUser = (
//   body: Pick<users, 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'>,
//   user_agent?: string
// ) =>
//   prismadb.users.create({
//     data: {
//       ...body,
//       user_activities: {
//         create: {
//           action: 'register',
//           user_agent
//         }
//       }
//     },
//     select: {
//       user_id: true,
//       role: true
//     }
//   })

// export const getUserByUsername = (username: string) =>
//   prismadb.users.findFirst({
//     select: { user_id: true, hashedPassword: true },
//     where: {
//       username: username?.toLowerCase()
//     }
//   })

// export const getAvaterByUserId = (user_id: string) =>
//   prismadb.users.findFirst({
//     select: {
//       avater: true
//     },
//     where: {
//       user_id
//     }
//   })

// export const getCurrentUser = (user_id: string) =>
//   prismadb.users.findFirst({
//     where: {
//       user_id
//     },
//     select: {
//       fullname: true,
//       username: true,
//       email: true,
//       avater: true,
//       role: true,
//       createdAt: true
//     }
//   })

// export const patchPassword = (hashedPassword: string, user_id: string) =>
//   prismadb.users.update({
//     where: {
//       user_id
//     },
//     data: {
//       hashedPassword
//     }
//   })

// export const patchEmail = (email: string, user_id: string) =>
//   prismadb.users.update({
//     where: {
//       user_id
//     },
//     data: {
//       email: email?.toLowerCase()
//     }
//   })

// export const getForgeter = (user: string) =>
//   prismadb.users.findFirst({
//     where: {
//       isActive: true,
//       OR: [{ username: user?.toLowerCase() }, { email: user?.toLowerCase() }]
//     },
//     select: {
//       user_id: true,
//       email: true,
//       hashedPassword: true
//     }
//   })

// export const getHashByUserId = (user_id: string) =>
//   prismadb.users.findFirst({
//     select: {
//       hashedPassword: true
//     },
//     where: {
//       user_id
//     }
//   })
