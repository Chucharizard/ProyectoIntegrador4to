// src/components/shared/DataTable.jsx
const DataTable = ({ 
  columns, 
  data, 
  emptyMessage = "No se encontraron registros",
  emptyIcon: EmptyIcon
}) => {
  return (
    <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl border border-green-500/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700/50">
          <thead className="bg-gray-900/50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-green-400 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  {EmptyIcon && <EmptyIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />}
                  <p className="text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="hover:bg-gray-800/30 transition-colors duration-150"
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                    >
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
