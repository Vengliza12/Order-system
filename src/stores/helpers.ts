export function getStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null
}

export function loadCollection<T>(storageKey: string): T[] {
  const storage = getStorage()

  if (!storage)
    return []

  const raw = storage.getItem(storageKey)

  if (!raw)
    return []

  try {
    const parsed = JSON.parse(raw) as unknown

    return Array.isArray(parsed) ? parsed as T[] : []
  }
  catch {
    return []
  }
}

export function saveCollection<T>(storageKey: string, items: T[]) {
  const storage = getStorage()

  if (storage)
    storage.setItem(storageKey, JSON.stringify(items))
}

export function getNextId<T extends { id: number }>(items: T[]) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}
