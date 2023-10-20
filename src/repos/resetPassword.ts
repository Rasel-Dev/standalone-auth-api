import prismadb from 'src/libs/prismadb'

export const saveResetPassword = (user_id: string, last_pwd_hashed: string, provider_id?: string) =>
  prismadb.reset_passwords.create({
    data: {
      user_id,
      last_pwd_hashed,
      provider_id
    },
    select: {
      reset_password_id: true
    }
  })

export const verifyResetToken = (reset_password_id: string) =>
  prismadb.reset_passwords.findFirstOrThrow({
    where: {
      reset_password_id,
      active: true
    },
    select: {
      last_pwd_hashed: true
    }
  })

export const expireResetToken = (reset_password_id: string) =>
  prismadb.reset_passwords.update({
    where: { reset_password_id },
    data: {
      active: false
    }
  })
