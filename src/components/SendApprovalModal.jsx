import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { SendHorizonal, X } from 'lucide-react'
import '../styles/approval-modal.css'

const FACULTY_OPTIONS = [
  { facultyName: 'Dr. Meera Nair', employeeId: 'EMP1021', designation: 'Professor' },
  { facultyName: 'Dr. Arun Kumar', employeeId: 'EMP1045', designation: 'Associate Professor' },
  { facultyName: 'Dr. Priya Shah', employeeId: 'EMP1098', designation: 'Assistant Professor' },
  { facultyName: 'Dr. Karthik Raman', employeeId: 'EMP1120', designation: 'Professor' },
]

const emptyForm = {
  facultyName: '',
  employeeId: '',
  designation: '',
  note: '',
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
}

function ApprovalSearchField({ label, value, listId, options, onChange }) {
  return (
    <label className="approval-modal-field">
      <span>{label}</span>
      <input
        value={value}
        list={listId}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Search ${label.toLowerCase()}`}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  )
}

export default function SendApprovalModal({ open, title = 'Send to Approval', contextLabel = '', onClose, onSend }) {
  const [form, setForm] = useState(emptyForm)
  const optionLists = useMemo(() => ({
    facultyName: uniqueValues(FACULTY_OPTIONS.map((item) => item.facultyName)),
    employeeId: uniqueValues(FACULTY_OPTIONS.map((item) => item.employeeId)),
    designation: uniqueValues(FACULTY_OPTIONS.map((item) => item.designation)),
  }), [])

  if (!open) return null

  const syncField = (field, value) => {
    const exactMatch = FACULTY_OPTIONS.find((item) => String(item[field]).toLowerCase() === String(value).toLowerCase())

    if (exactMatch) {
      setForm((current) => ({ ...current, ...exactMatch }))
      return
    }

    if (field === 'designation') {
      const matchingDesignation = FACULTY_OPTIONS.filter((item) => String(item.designation).toLowerCase() === String(value).toLowerCase())

      if (matchingDesignation.length === 1) {
        setForm((current) => ({ ...current, ...matchingDesignation[0] }))
        return
      }
    }

    setForm((current) => ({ ...current, [field]: value }))
  }

  const canSend = form.facultyName.trim() && form.employeeId.trim() && form.designation.trim()

  const handleSend = () => {
    if (!canSend) return

    onSend?.({
      facultyName: form.facultyName.trim(),
      employeeId: form.employeeId.trim(),
      designation: form.designation.trim(),
      note: form.note.trim(),
    })
    setForm(emptyForm)
  }

  const handleClose = () => {
    setForm(emptyForm)
    onClose?.()
  }

  return createPortal(
    <div className="approval-modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={handleClose}>
      <div className="approval-modal" onClick={(event) => event.stopPropagation()}>
        <div className="approval-modal-head">
          <div>
            <strong>{title}</strong>
            {contextLabel ? <p>{contextLabel}</p> : null}
          </div>
          <button type="button" className="ghost approval-modal-close" onClick={handleClose} aria-label="Close approval popup">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="approval-modal-grid">
          <ApprovalSearchField
            label="Faculty Name"
            listId="approval-faculty-name-options"
            value={form.facultyName}
            options={optionLists.facultyName}
            onChange={(value) => syncField('facultyName', value)}
          />
          <ApprovalSearchField
            label="Employee ID"
            listId="approval-employee-id-options"
            value={form.employeeId}
            options={optionLists.employeeId}
            onChange={(value) => syncField('employeeId', value)}
          />
          <ApprovalSearchField
            label="Designation"
            listId="approval-designation-options"
            value={form.designation}
            options={optionLists.designation}
            onChange={(value) => syncField('designation', value)}
          />
          <label className="approval-modal-field approval-modal-field-wide">
            <span>Note</span>
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Add approval note"
            />
          </label>
        </div>

        <div className="approval-modal-foot">
          <button type="button" className="ghost" onClick={handleClose}>Cancel</button>
          <button type="button" className="tool-btn green" onClick={handleSend} disabled={!canSend}>
            <SendHorizonal size={15} strokeWidth={2} />
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
