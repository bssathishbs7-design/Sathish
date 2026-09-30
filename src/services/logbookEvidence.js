/** Read or compress an image to the existing 300 KB limit; return the persisted attachment shape.
 * @param {File} file @returns {Promise<{name:string,kind:string,dataUrl:string}>}
 */
export async function prepareLogbookPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP photo.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB for resizing.')
  const read = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('This photo could not be read.')); reader.readAsDataURL(blob) })
  if (file.size <= 300 * 1024) return { name: file.name, kind: 'image', dataUrl: await read(file) }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image(); image.src = url; await image.decode()
    if (image.width * image.height > 50000000) throw new Error('This photo is too large to resize. Choose a smaller image.')
    const canvas = document.createElement('canvas')
    for (let edge = 1600; edge >= 400; edge = Math.floor(edge * .75)) {
      const scale = Math.min(1, edge / Math.max(image.width, image.height))
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale)
      const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82))
      if (blob && blob.size <= 300 * 1024) return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', kind: 'image', dataUrl: await read(blob) }
    }
    throw new Error('This image cannot fit the 300 KB limit. Choose a smaller photo.')
  } finally { URL.revokeObjectURL(url) }
}
