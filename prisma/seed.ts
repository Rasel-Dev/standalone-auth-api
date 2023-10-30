import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const plan = await prisma.plans.createMany({
    data: [
      {
        plan_id: '92a5165f-ca7c-47e2-ba63-649a54135cb6',
        name: 'Basic',
        description: 'This is about basic plan.',
        features: '10 users, 1 provider',
        plan_limit: 10
      },
      {
        plan_id: '5253f431-dc55-4b16-bcfe-cf27cbc9c6d6',
        name: 'Pro',
        description: 'This is about basic plan.',
        features: '20 users, 1 provider',
        plan_limit: 20
      },
      {
        plan_id: '91cb0512-3666-43eb-a195-da561bcf3a33',
        name: 'Free',
        description: 'This is about free plan.',
        features: '3 users, 1 provider',
        plan_limit: 3
      }
    ]
  })
  const users = await prisma.users.createMany({
    data: [
      {
        user_id: '38654b40-7256-4d52-88d6-0217970d7232',
        fullname: 'Ferry',
        username: 'conroy_706996',
        email: 'cassin.cb4d3fbe4282@hotmail.com',
        hashedPassword: '$2b$12$LW7buXNO2udypi3xBMyx0.hkW0pj.R1BCLCCUJM5Zg.12LcF8OPtS',
        role: 'PROVIDER'
      },
      {
        user_id: '71b866e7-f98a-4210-bc8f-284863f1f4a8',
        fullname: 'Bode',
        username: 'garcia_867994',
        email: 'raseldeveloper2@gmail.com',
        hashedPassword: '$2b$12$zVAq6TVLU03jHTFjGIOz0OW89JM4qw4klg1iFmmAcQa26s04ws1cC'
      },
      {
        user_id: 'c63c4e2a-5b9a-462c-a8ee-6a09c7c737d3',
        fullname: 'Borer',
        username: 'crooks_953811',
        email: 'collier.b6ec4ae2e43b@hotmail.com',
        hashedPassword: '$2b$12$rosNILxL4NfGSVHZAxR3IemY1PI7JPllA911h08ul2T9G28Z2BF2q'
      }
    ]
  })
  const provider = await prisma.providers.create({
    data: {
      provider_id: 'e74fdba4-edd4-448c-829d-19f151696a45',
      plan_id: '91cb0512-3666-43eb-a195-da561bcf3a33',
      user_id: '38654b40-7256-4d52-88d6-0217970d7232',
      organize_name: 'Hello World',
      organize_domains: 'https://localhost,http://localhost',
      api_key: 'ton2lg8aiu1g91khkpy3w8k56r0kdi'
    }
  })
  const consumer = await prisma.consumers.createMany({
    data: [
      {
        provider_id: 'e74fdba4-edd4-448c-829d-19f151696a45',
        user_id: '71b866e7-f98a-4210-bc8f-284863f1f4a8'
      },
      {
        provider_id: 'e74fdba4-edd4-448c-829d-19f151696a45',
        user_id: 'c63c4e2a-5b9a-462c-a8ee-6a09c7c737d3'
      }
    ]
  })

  console.log({ plan, users, provider, consumer })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
