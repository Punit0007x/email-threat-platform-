export default function HeaderPanel({ data }) {
  if (!data) return null;

  const rows = [
    { label: "From", value: data.from_address },
    { label: "To", value: data.to_address },
    { label: "Subject", value: data.subject },
    { label: "Date", value: data.date },
    { label: "Message-ID", value: data.message_id },
    { label: "Return-Path", value: data.return_path },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
        <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg mr-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </span>
        Email Headers
      </h2>
      
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700 text-sm text-left">
          <tbody className="divide-y divide-slate-700 bg-slate-800/50">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-750 transition-colors">
                <th className="px-4 py-3 font-medium text-slate-400 w-1/4 bg-slate-800/80">
                  {row.label}
                </th>
                <td className="px-4 py-3 text-slate-200 break-all font-mono text-xs">
                  {row.value || <span className="text-slate-500 italic">Not available</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
