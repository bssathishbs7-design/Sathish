import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { BriefcaseBusiness, Check, ChevronDown, IdCard, SendHorizonal, UserRound, X } from 'lucide-react'
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

const defaultForm = {
  ...FACULTY_OPTIONS[0],
  note: '',
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
}

function ApprovalSearchField({ label, value, listId, options, onChange, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false)
  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase()

    if (!query) return options

    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, value])

  return (
    <div className="approval-modal-field">
      <span>{label}</span>
      <div className={`approval-modal-search-control ${isOpen ? 'is-open' : ''}`}>
        {Icon ? <Icon className="approval-modal-search-icon" size={17} strokeWidth={2} /> : null}
        <input
          value={value}
          aria-label={label}
          aria-controls={listId}
          aria-expanded={isOpen}
          autoComplete="off"
          role="combobox"
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={label}
        />
        <ChevronDown className="approval-modal-search-action" size={16} strokeWidth={2} aria-hidden="true" />
        {isOpen ? (
          <div id={listId} className="approval-modal-options" role="listbox">
            {filteredOptions.length ? filteredOptions.map((option) => {
              const isSelected = option.toLowerCase() === value.trim().toLowerCase()

              return (
                <button
                  key={option}
                  type="button"
                  className={`approval-modal-option ${isSelected ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onChange(option)
                    setIsOpen(false)
                  }}
                >
                  <span>{option}</span>
                  {isSelected ? <Check size={14} strokeWidth={2.3} /> : null}
                </button>
              )
            }) : (
              <div className="approval-modal-option-empty">No matches</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function SendApprovalModal({ open, title = 'Send to Approval', contextLabel = '', onClose, onSend }) {
  const [form, setForm] = useState(defaultForm)
  const optionLists = useMemo(() => ({
    facultyName: uniqueValues(FACULTY_OPTIONS.map((item) => item.facultyName)),
    employeeId: uniqueValues(FACULTY_OPTIONS.map((item) => item.employeeId)),
    designation: uniqueValues(FACULTY_OPTIONS.map((item) => item.designation)),
  }), [])

  useEffect(() => {
    if (open) {
      setForm(defaultForm)
    }
  }, [open])

  if (!open) return null

  const isDarkMode = typeof document !== 'undefined' && Boolean(document.querySelector('.vx-shell.theme-dark'))

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
    setForm(defaultForm)
  }

  const handleClose = () => {
    setForm(defaultForm)
    onClose?.()
  }

  return createPortal(
    <div className={`approval-modal-backdrop ${isDarkMode ? 'theme-dark' : ''}`.trim()} role="dialog" aria-modal="true" aria-label={title} onClick={handleClose}>
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
            icon={UserRound}
          />
          <ApprovalSearchField
            label="Employee ID"
            listId="approval-employee-id-options"
            value={form.employeeId}
            options={optionLists.employeeId}
            onChange={(value) => syncField('employeeId', value)}
            icon={IdCard}
          />
          <ApprovalSearchField
            label="Designation"
            listId="approval-designation-options"
            value={form.designation}
            options={optionLists.designation}
            onChange={(value) => syncField('designation', value)}
            icon={BriefcaseBusiness}
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
