type DateTimePatchOption = {
  year?: number
  month?: number
  day?: number
  hour?: number
  min?: number
  sec?: number
}

type DateTimeResponseFormate = 'butify' | 'int' | 'iso'

export function timeToMs(options: DateTimePatchOption) {
  const second = 60 * 1000
  const hour = second * 60
  const day = hour * 24
  const month = day * 30
  const year = day * 365
  let ms = 0
  if (options.year) ms += year * options.year
  if (options.month) ms += month * options.month
  if (options.day) ms += day * options.day
  if (options.hour) ms += hour * options.hour
  if (options.min) ms += second * options.min
  if (options.sec) ms += 1000 * options.sec
  return ms
}

export function dateTime(dt?: Date, formate?: DateTimeResponseFormate) {
  // const timeZone = new Date().toLocaleString([], { timeZone: 'Asia/Dhaka' })
  const initDate = !!dt ? new Date(dt) : new Date()
  // initDate.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })

  const returnFormate = (returnDt: number) => {
    const newDate = new Date(new Date(returnDt).toLocaleString([], { timeZone: 'Asia/Dhaka' }))

    switch (formate) {
      case 'iso':
        return newDate.toISOString()
      case 'int':
        return newDate.getTime() / 1000
      case 'butify': {
        const fm = (num: number) => (num < 10 ? `0${num}` : num)
        const year = newDate.getFullYear()
        const month = newDate.getMonth()
        const date = newDate.getDate()
        const hour = newDate.getHours()
        const minute = newDate.getMinutes()
        const second = newDate.getSeconds()
        const ampm = hour >= 12 ? 'pm' : 'am'
        return `${fm(year)}-${fm(month)}-${fm(date)} ${fm(hour)}:${fm(minute)}:${fm(second)} ${ampm.toUpperCase()}`
      }
      default:
        return newDate
    }
  }

  /**
   * This function make your current date addition with { year, month, day, hour, min, sec }
   * @param options year | month | day | hour | min | sec
   * @returns
   */
  const add = (options: DateTimePatchOption) => returnFormate(initDate.getTime() + timeToMs(options))
  /**
   * This function make your current date subtraction with { year, month, day, hour, min, sec }
   * @param options year | month | day | hour | min | sec
   * @returns
   */
  const sub = (options: DateTimePatchOption) => returnFormate(initDate.getTime() - timeToMs(options))

  return { now: returnFormate(initDate.getTime()), add, sub }
}

// const example = dateTime(undefined, 'int')
// console.log('now :', new Date(example.now))
// console.log('add :', example.add({ sec: 1 }))
// const x = Math.floor((Date.now() + timeToMs({ min: 1 })) / 1000)
// console.log('add :', example.add({ min: 1 }), x)
