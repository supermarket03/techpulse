export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <div className="text-center">
        <p className="text-gray-600 font-medium">Analyzing Financial Data</p>
        <p className="text-gray-500 text-sm">Fetching Reddit buzz, stock data, and news sentiment...</p>
      </div>
    </div>
  )
}