import { readFileSync, writeFileSync } from 'fs'
import { TokenExpiredError, verify } from 'jsonwebtoken'
import jwktopem from 'jwk-to-pem'
import jose from 'node-jose'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { APP_ENV } from '..'
import { dateTime } from './datetime'

// const ua = 'Access Denied! Unauthorized user.'
// const publicKey = readFileSync(join('./keys/public.key'), 'utf-8')
// const privateKey = readFileSync(join('./keys/private.key'), 'utf-8')

// let publicKey: string
// let privateKey: string

// try {
//   publicKey = readFileSync(join('./keys/public.key'), 'utf-8')
//   privateKey = readFileSync(join('./keys/private.key'), 'utf-8')
// } catch (error) {
//   publicKey = 'asdiahsdasidbeqduyuycbuecvw'
//   privateKey = 'asdiahsdasidbeqduyuycbuecvw'
// }

// export const verifyOptions: VerifyOptions = {
//   algorithms: ['RS256']
// }

export interface TokenPayload {
  jti: string
  aud: string
  scopes: string[]
  iss?: string
}
// /**
//  * It signs a JWT access token with the user's id, rights and scopes, and stores it in Redis
//  * @param {number} userId - The user's id
//  * @param {string} rights - string - This is the rights that the user has.
//  * @param {string[]} scopes - string[] = []
//  * @returns A promise that resolves to a token
//  */
// export const signAccessToken = (userId: string, scopes: string[] = [], issuer = APP_ENV.JWT_ISSUER): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     const payload = {
//       jti: uuid(),
//       // iat: Math.floor(Date.now() / 1000) - 30,
//       scopes: [...scopes]
//       // user: userId
//     }
//     const options: SignOptions = {
//       algorithm: 'RS256',
//       expiresIn: `${APP_ENV.JWT_ACCESS_TOKEN_EXP}m`, // expires in minutes
//       issuer,
//       audience: userId
//     }
//     sign(payload, privateKey, options, (err, token) => {
//       if (err) {
//         reject(err)
//       }
//       try {
//         // await setRedisAsync(`ur_${uuid}`, token, 'EX', Number(+JWT_ACCESS_TOKEN_EXP! * 24 * 61 * 60));
//         resolve(token)
//       } catch (error) {
//         if (error instanceof Error) reject(error)
//       }
//     })
//   })
// }

// /**
//  * It signs a JWT refresh token with the user's id, rights, and scopes, and then stores it in Redis
//  * @param {number} userId - The user's ID
//  * @param {string} rights - string - the rights of the user
//  * @param {string[]} scopes - string[] = [] - an array of scopes that the user has access to.
//  * @returns A promise that resolves to a token.
//  */
// export const signRefreshToken = (userId: string, scopes: string[] = [], issuer = APP_ENV.JWT_ISSUER): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     // cirtificate token
//     //   const privateKey: string = readPrivateKey(false)!;
//     const payload = {
//       jti: uuid(),
//       // iat: Math.floor(Date.now() / 1000) - 30,
//       scopes: [...scopes]
//       // user: userId
//     }
//     const options: SignOptions = {
//       algorithm: 'RS256',
//       expiresIn: `${APP_ENV.JWT_REFRESH_TOKEN_EXP}d`, // expires in days
//       issuer,
//       audience: userId
//     }
//     sign(payload, privateKey, options, async (err, token): Promise<void> => {
//       if (err) reject(err)
//       try {
//         // remove first
//         // await remRedisAsync(`user:${userId}`);
//         // then save new one
//         // await setRedisAsync(`user:${userId}`, token, 'EX', Number(+APP_ENV.JWT_REFRESH_TOKEN_EXP * 24 * 60 * 60));
//         resolve(token)
//       } catch (error) {
//         // console.log(error, 'JWT-SIGN-REFRESH');
//         if (error instanceof Error) reject(error)
//       }
//     })
//   })
// }

// /**
//  * It takes a token, reads the public key from the file system, and then uses the verify function from
//  * the jsonwebtoken library to verify the token
//  * @param {string} token - The token to validate
//  * @returns A promise that resolves to a TokenPayload object.
//  */
// export function verifyAccessToken(token: string): Promise<TokenPayload> {
//   // cirtificate token
//   // const publicKey: string = readPublicKey()!;
//   // const verifyOptions: VerifyOptions = {
//   //   algorithms: ['RS256'],
//   // };

//   return new Promise((resolve, reject) => {
//     verify(token, publicKey, verifyOptions, (error, decoded: TokenPayload | any) => {
//       // console.log('error :', error)
//       // if validation fails
//       if (error) return reject(error)

//       // console.log('decoded :', decoded);
//       resolve(decoded)
//     })
//   })
// }

// /**
//  * It verifies the refresh token, and if it's valid, it returns the userID, the user's rights, and the
//  * jti
//  * @param {string} refreshToken - The refresh token that was sent to the client.
//  * @returns A promise that resolves to an object containing the userID, rights, and jti.
//  */
// export const verifyRefreshToken = (
//   refreshToken: string,
//   isLogoutParpuse = false
// ): Promise<{ aud: string; scopes: string; jti: string }> => {
//   return new Promise((resolve, reject) => {
//     // certificate token
//     // const publicKey: string = readPublicKey(false)!;
//     verify(refreshToken, publicKey, verifyOptions, (err: any, decoded: TokenPayload | any) => {
//       if (err) reject(!isLogoutParpuse ? ua : 'invalid_refresh_token')

//       const { aud, scopes, jti } = decoded
//       resolve({ aud, scopes, jti })

//       // try {
//       //   //   if (!!affectedRows) resolve({ userID, rights: data?.role, jti })
//       //   //   if (isLogoutParpuse) resolve({ userID, rights: data?.role, jti })
//       //   reject(ua)
//       // } catch (error) {
//       //   if (error instanceof Error) reject(error)
//       // }
//     })
//   })
// }

export const genAuthToken = async (userId: string, scopes: string[] = [], issuer = APP_ENV.JWT_ISSUER) => {
  const ks = readFileSync(join('./public/.well-known/keys.json'))
  const keyStore = await jose.JWK.asKeyStore(ks.toString())
  const [key] = keyStore.all({ use: 'sig' })

  const { now, add } = dateTime(undefined, 'int')

  const opt = { compact: true, jwk: key, fields: { typ: 'jwt', iss: issuer } }
  // console.log('add({ min: APP_ENV.JWT_ACCESS_TOKEN_EXP }) :', add({ min: APP_ENV.JWT_ACCESS_TOKEN_EXP }))
  const accessPayload = JSON.stringify({
    jti: uuid(),
    exp: add({ min: APP_ENV.JWT_ACCESS_TOKEN_EXP }), // for minutes
    iat: now,
    scopes: [...scopes],
    aud: userId
  })
  const refreshPayload = JSON.stringify({
    jti: uuid(),
    exp: add({ day: APP_ENV.JWT_REFRESH_TOKEN_EXP }), // for days
    iat: now,
    scopes: [...scopes],
    aud: userId
  })
  const token = jose.JWS.createSign(opt, key).update(accessPayload)
  const token2 = jose.JWS.createSign(opt, key).update(refreshPayload)

  const [access, refresh] = await Promise.all([token.final(), token2.final()])
  return { accessToken: access + '', refreshToken: refresh + '' }
}
// ;(async () => {
//   const token = await genAuthToken('12388', [], 'https://yourdomain.com')
//   console.log('token :', token)
// })()

export const newJwk = async () => {
  try {
    const keyStore = jose.JWK.createKeyStore()
    await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })
    writeFileSync(join('./public/.well-known/keys.json'), JSON.stringify(keyStore.toJSON(true), null, '  '))
  } catch (error) {
    throw error
  }
}

export const jwkRotation = async () => {
  const ks = readFileSync(join('./public/.well-known/keys.json'))
  const keyStore = await jose.JWK.asKeyStore(ks.toString())
  await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })
  const json = keyStore.toJSON(true) as { keys: string[] }
  json.keys = json?.keys.reverse()
  writeFileSync(join('./public/.well-known/keys.json'), JSON.stringify(json, null, '  '))
  return keyStore.toJSON()
}

export const verifyAuthToken = async (token: string): Promise<TokenPayload | void> => {
  // const { data } = await axios.get('http://localhost:4040/jwks')
  const keyData = JSON.parse(readFileSync(join('./public/.well-known/keys.json'), 'utf-8'))
  const [firstKey] = keyData.keys
  const publicKey = jwktopem(firstKey)
  return new Promise((resolve, reject) => {
    try {
      const decoded = verify(token, publicKey)
      resolve(decoded as TokenPayload)
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        if (e.name === 'TokenExpiredError') return resolve()
      }
      reject(e)
    }
  })
}
