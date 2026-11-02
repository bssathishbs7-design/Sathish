import { useState } from 'react'
import './StudentAvatar.css'

/** Displays a student's uploaded photo, falling back to first/last name initials.
 * @param {{name:string, photo?:string}} props
 */
export default function StudentAvatar({ name, photo }) {
  const [failedPhoto, setFailedPhoto] = useState(null)
  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  const initials = [words[0], words.length > 1 ? words.at(-1) : null]
    .filter(Boolean).map(word => Array.from(word)[0]).join('').toLocaleUpperCase() || '?'
  return <span className="sm-student-avatar" aria-hidden="true">
    {photo && photo !== failedPhoto
      ? <img src={photo} alt="" loading="lazy" onError={() => setFailedPhoto(photo)} />
      : initials}
  </span>
}
