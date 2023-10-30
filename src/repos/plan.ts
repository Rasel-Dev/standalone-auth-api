import { Prisma, plans } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'
import prismadb from 'src/libs/prismadb'

// export const fetchAllPlans = () =>
//   prismadb.plans.findMany({
//     where: {
//       status: true
//     }
//   })

type PlanBody = Pick<plans, 'name' | 'description' | 'features' | 'plan_limit'>

// export const newPlan = (data: PlanBody) =>
//   prismadb.plans.create({
//     data
//   })

// export const patchPlan = (data: Partial<PlanBody>, plan_id: string) =>
//   prismadb.plans.update({
//     where: {
//       plan_id
//     },
//     data,
//     select: {
//       plan_id: true
//     }
//   })

// export const patchPlanStatus = (status: boolean, plan_id: string) =>
//   prismadb.plans.update({
//     where: {
//       plan_id
//     },
//     data: {
//       status
//     },
//     select: {
//       plan_id: true,
//       status: true
//     }
//   })

// export const checkPlanActive = (plan_id: string) =>
//   prismadb.plans.findUnique({
//     where: { plan_id },
//     select: { status: true }
//   })

class PlanRepo {
  private plan: Prisma.plansDelegate<DefaultArgs>

  constructor() {
    this.plan = prismadb.plans
  }

  /**
   * Get all active plan
   * @returns list of plans
   */
  public gets() {
    return this.plan.findMany({ where: { status: true } })
  }

  /**
   * Save single plan info
   * @param data PlanBody
   * @returns created plan_id:string
   */
  public save(data: PlanBody) {
    return this.plan.create({ select: { plan_id: true }, data })
  }

  /**
   * Check plan is active or not
   * @param plan_id Which plan to check
   */
  public isActive(plan_id: string) {
    return this.plan.findUnique({ where: { plan_id }, select: { status: true } })
  }

  /**
   * Update plan information
   * @param data PlanBody partial data
   * @param plan_id which plan to update
   */
  public update(data: Partial<PlanBody>, plan_id: string) {
    return this.plan.update({ where: { plan_id }, data, select: { plan_id: true } })
  }

  /**
   * Only patch the plan status
   * @param status Status of the plan
   * @param plan_id which plan to patch
   */
  public patchStatus(status: boolean, plan_id: string) {
    return this.plan.update({ where: { plan_id }, data: { status }, select: { plan_id: true, status: true } })
  }
}

export default new PlanRepo()
