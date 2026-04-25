type StorageLookup = string | string[] | Record<string, unknown> | null | undefined

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error(fallbackMessage)
}

function ensureChrome(feature: string): typeof chrome {
  if (typeof chrome === 'undefined' || typeof chrome.runtime === 'undefined') {
    throw new Error(`Chrome extension API unavailable for ${feature}.`)
  }

  return chrome
}

export async function getLocalStorage<T>(keys: StorageLookup = null): Promise<T> {
  const extensionApi = ensureChrome('storage.local.get')

  return new Promise<T>((resolve, reject) => {
    try {
      extensionApi.storage.local.get(keys ?? null, (items) => {
        const message = extensionApi.runtime.lastError?.message

        if (message) {
          reject(new Error(message))
          return
        }

        resolve(items as T)
      })
    } catch (error) {
      reject(toError(error, 'Unable to read SnipBit storage.'))
    }
  })
}

export async function setLocalStorage(items: Record<string, unknown>): Promise<void> {
  const extensionApi = ensureChrome('storage.local.set')

  return new Promise<void>((resolve, reject) => {
    try {
      extensionApi.storage.local.set(items, () => {
        const message = extensionApi.runtime.lastError?.message

        if (message) {
          reject(new Error(message))
          return
        }

        resolve()
      })
    } catch (error) {
      reject(toError(error, 'Unable to update SnipBit storage.'))
    }
  })
}

export async function getCurrentWindow(): Promise<chrome.windows.Window> {
  const extensionApi = ensureChrome('windows.getCurrent')

  return new Promise<chrome.windows.Window>((resolve, reject) => {
    try {
      extensionApi.windows.getCurrent({}, (currentWindow) => {
        const message = extensionApi.runtime.lastError?.message

        if (message) {
          reject(new Error(message))
          return
        }

        resolve(currentWindow)
      })
    } catch (error) {
      reject(toError(error, 'Unable to get the current Chrome window.'))
    }
  })
}

export async function createTab(url: string): Promise<chrome.tabs.Tab> {
  const extensionApi = ensureChrome('tabs.create')

  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    try {
      extensionApi.tabs.create({ url }, (tab) => {
        const message = extensionApi.runtime.lastError?.message

        if (message) {
          reject(new Error(message))
          return
        }

        resolve(tab)
      })
    } catch (error) {
      reject(toError(error, 'Unable to open a SnipBit tab.'))
    }
  })
}

export async function createContextMenu(options: chrome.contextMenus.CreateProperties): Promise<void> {
  const extensionApi = ensureChrome('contextMenus.create')

  return new Promise<void>((resolve, reject) => {
    try {
      extensionApi.contextMenus.create(options, () => {
        const message = extensionApi.runtime.lastError?.message

        if (message && !message.toLowerCase().includes('duplicate')) {
          reject(new Error(message))
          return
        }

        resolve()
      })
    } catch (error) {
      reject(toError(error, 'Unable to create the SnipBit context menu.'))
    }
  })
}

export function addStorageChangeListener(
  listener: Parameters<typeof chrome.storage.onChanged.addListener>[0],
): () => void {
  if (typeof chrome === 'undefined' || typeof chrome.storage?.onChanged === 'undefined') {
    return () => undefined
  }

  chrome.storage.onChanged.addListener(listener)

  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}

export function getExtensionUrl(path: string): string {
  if (typeof chrome === 'undefined' || typeof chrome.runtime?.getURL === 'undefined') {
    return path
  }

  return chrome.runtime.getURL(path)
}

export async function openManagerSurface(path = 'sidepanel.html'): Promise<'sidepanel' | 'tab'> {
  try {
    const extensionApi = ensureChrome('sidePanel.open')
    const currentWindow = await getCurrentWindow()

    if (currentWindow.id !== undefined && extensionApi.sidePanel?.open) {
      await extensionApi.sidePanel.open({ windowId: currentWindow.id })
      return 'sidepanel'
    }
  } catch (error) {
    console.warn('Unable to open the SnipBit side panel, falling back to a tab.', error)
  }

  await createTab(getExtensionUrl(path))
  return 'tab'
}