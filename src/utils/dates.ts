export function getIsoNow(): string {
  return new Date().toISOString()
}

export function formatRelativeTimestamp(value: string): string {
  const date = new Date(value)
  const time = date.getTime()

  if (Number.isNaN(time)) {
    return 'Unknown time'
  }

  const now = Date.now()
  const differenceInMilliseconds = time - now
  const absoluteDifference = Math.abs(differenceInMilliseconds)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (absoluteDifference < hour) {
    return formatter.format(Math.round(differenceInMilliseconds / minute), 'minute')
  }

  if (absoluteDifference < day) {
    return formatter.format(Math.round(differenceInMilliseconds / hour), 'hour')
  }

  return formatter.format(Math.round(differenceInMilliseconds / day), 'day')
}