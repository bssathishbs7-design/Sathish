/** Validate and centre-crop a student photo. Original image URLs are always released. */
export async function prepareStudentPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose JPEG, PNG or WebP, at most 5 MiB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image(); image.src = url; await image.decode()
    if (Math.min(image.naturalWidth, image.naturalHeight) < 64) throw new Error('Photo must be at least 64 pixels in both dimensions.')
    const crop = Math.min(image.naturalWidth, image.naturalHeight), size = Math.min(400, crop)
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size
    canvas.getContext('2d').drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 0, 0, size, size)
    return canvas.toDataURL('image/jpeg', .85)
  } finally { URL.revokeObjectURL(url) }
}
