import { useState } from 'react'
import LogbookDrawer from './LogbookDrawer'
import './LogbookEvidence.css'

/** Accessible thumbnails and full-size inspection; stored data URLs are restricted to images. */
export default function LogbookEvidence({ photos = [], theme }) {
  const [selected, setSelected] = useState(null)
  return <><div className="lb-evidence-grid">{photos.map((photo, index) => /^data:image\/(png|jpeg|webp);base64,/.test(photo.dataUrl || '') && <button type="button" className="lb-evidence-photo" key={index} onClick={() => setSelected(photo)} aria-label={`Enlarge ${photo.name}`}><img src={photo.dataUrl} alt="" loading="lazy" /><span>{photo.name}</span></button>)}</div>{selected && <LogbookDrawer title={selected.name} subtitle="Evidence photo" theme={theme} onClose={() => setSelected(null)}><div className="lb-drawer-body"><img className="lb-evidence-full" src={selected.dataUrl} alt={selected.name} /></div><footer className="lb-drawer-foot"><button type="button" className="lb-btn" onClick={() => setSelected(null)}>Close photo</button></footer></LogbookDrawer>}</>
}
