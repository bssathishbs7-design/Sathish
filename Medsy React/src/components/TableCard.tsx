'use client'

const baseRows = [
  ['1', 'Mark', 'Otto', '@mdo'],
  ['2', 'Jacob', 'Thornton', '@fat'],
  ['3', 'Larry', 'Bird', '@twitter'],
]

export function TableCard({ title, helper, className = '', rows = baseRows }) {
  return (
    <section className={`vx-card ${className}`}>
      <header className="vx-card-head">
        <div>
          <h3>{title}</h3>
          <p>{helper}</p>
        </div>
        <button type="button" className="vx-dots" aria-label="More options">
          ...
        </button>
      </header>
      <div className="vx-table-wrap">
        <table className="vx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>First</th>
              <th>Last</th>
              <th>Handle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={`${row[0]}-${cell}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
