"use client"

import { Flame, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"

interface HypeAnalysisData {
  socialHype: string
  fundamentalScore: string
  hypeRatio: string
  verdict: "OVERHYPED" | "UNDERVALUED" | "BALANCED"
}

interface HypeAnalysisProps {
  data: HypeAnalysisData
  stockSymbol: string
}

export default function HypeAnalysis({ data, stockSymbol }: HypeAnalysisProps) {
  const getVerdictConfig = () => {
    switch (data.verdict) {
      case "OVERHYPED":
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          description: "High social buzz relative to fundamentals - exercise caution",
        }
      case "UNDERVALUED":
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          description: "Low buzz but solid fundamentals - potential opportunity",
        }
      default:
        return {
          icon: <BarChart3 className="h-6 w-6" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          description: "Social interest aligns well with fundamentals",
        }
    }
  }

  const config = getVerdictConfig()

  return (
    <div className={`rounded-xl shadow-sm border p-6 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Flame className="h-6 w-6 mr-3 text-orange-500" />
          Hype vs Reality Analysis
        </h3>
        <div className={`flex items-center px-4 py-2 rounded-full ${config.color} font-bold text-lg`}>
          {config.icon}
          <span className="ml-2">{data.verdict}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{data.socialHype}/10</div>
            <div className="text-sm font-medium text-gray-700">Social Hype Score</div>
            <div className="text-xs text-gray-500 mt-1">Reddit buzz intensity</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{data.fundamentalScore}/10</div>
            <div className="text-sm font-medium text-gray-700">Fundamental Score</div>
            <div className="text-xs text-gray-500 mt-1">Financial health rating</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{data.hypeRatio}</div>
            <div className="text-sm font-medium text-gray-700">Hype Ratio</div>
            <div className="text-xs text-gray-500 mt-1">Social/Fundamental ratio</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border">
        <div className={`flex items-start space-x-3 ${config.color}`}>
          {config.icon}
          <div>
            <div className="font-semibold text-gray-900 mb-1">Analysis Summary</div>
            <p className="text-gray-700 text-sm">{config.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
