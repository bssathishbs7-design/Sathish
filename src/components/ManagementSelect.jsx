import { ChevronDown } from 'lucide-react'
import './ManagementSelect.css'

/** Native, keyboard-accessible select using the Student Management control pattern.
 * Accepts standard select props and option children; labels are owned by the caller.
 */
export default function ManagementSelect({ children, ...props }) {
  return <span className="management-select"><select {...props}>{children}</select><ChevronDown size={14} aria-hidden="true" /></span>
}
