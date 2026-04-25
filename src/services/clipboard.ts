export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard access is unavailable in this environment.')
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'

  document.body.append(textarea)
  textarea.select()

  const succeeded = document.execCommand('copy')
  textarea.remove()

  if (!succeeded) {
    throw new Error('Unable to copy the snippet to the clipboard.')
  }
}