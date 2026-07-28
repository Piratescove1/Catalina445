// Resize + JPEG-compress an uploaded image into a data URL so it fits in local
// storage without bloating it. Keeps aspect ratio; caps the longest side.
export function fileToCompressedDataURL(file, maxDim = 1400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('not-an-image'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const scale = Math.min(1, maxDim / Math.max(width, height))
      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image-load-failed')) }
    img.src = url
  })
}

// Compress an image so the resulting data URL fits within maxChars (so it can be
// stored in a single Firestore document, ~1 MB). Steps down size/quality until
// it fits; returns the smallest attempt even if the last one still exceeds.
export async function fileToConstrainedDataURL(file, maxChars = 900000) {
  const attempts = [[1400, 0.8], [1200, 0.7], [1000, 0.6], [800, 0.5], [640, 0.45]]
  let last = null
  for (const [dim, q] of attempts) {
    last = await fileToCompressedDataURL(file, dim, q)
    if (last.length <= maxChars) return last
  }
  return last
}
