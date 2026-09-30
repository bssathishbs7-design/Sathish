import './LogbookPagination.css'

/** Progressive rendering; the full result count remains visible and filtering precedes slicing. */
export default function LogbookPagination({ count, limit, onMore }) {
  return count > limit ? <div className="lb-pagination"><span role="status">Showing {limit} of {count}</span><button className="lb-btn" type="button" onClick={onMore}>Show 25 more</button></div> : null
}
