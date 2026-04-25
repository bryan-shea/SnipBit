import { createContextMenu } from '../services/chromeRuntime'
import { getPreferences } from '../services/preferencesStorage'
import { ensureSeededSnippets, saveSelectedTextSnippet } from '../services/snippetStorage'
import { normalizeMultilineText } from '../utils/text'

const SAVE_SELECTION_MENU_ID = 'snipbit-save-selection'

// Make the toolbar icon click open the side panel directly rather than a popup.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  console.error('Unable to configure SnipBit side panel behavior.', error)
})

async function initializeExtension() {
  await ensureSeededSnippets()
  await createContextMenu({
    id: SAVE_SELECTION_MENU_ID,
    title: 'Save selection to SnipBit',
    contexts: ['selection'],
  })
}

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension().catch((error) => {
    console.error('Unable to initialize SnipBit on install.', error)
  })
})

chrome.runtime.onStartup.addListener(() => {
  void initializeExtension().catch((error) => {
    console.error('Unable to initialize SnipBit on startup.', error)
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== SAVE_SELECTION_MENU_ID) {
    return
  }

  const selectionText = normalizeMultilineText(info.selectionText ?? '')

  if (!selectionText) {
    return
  }

  void (async () => {
    const preferences = await getPreferences()

    await saveSelectedTextSnippet(selectionText, {
      ...(tab?.url ? { sourceUrl: tab.url } : {}),
      ...(tab?.title ? { sourceTitle: tab.title } : {}),
      collectionId: preferences.defaultCollectionId ?? null,
    })
  })().catch((error) => {
    console.error('Unable to save a selected text snippet.', error)
  })
})