"use client"

import { DollarSign, TrendingUp, TrendingDown, Building2 } from "lucide-react"

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: string
  marketCap: number
  peRatio: number | string
  dayLow: number
  dayHigh: number
  yearHigh: number
  yearLow: number
  volume: number
  avgVolume: number
  eps: number
  beta: number
  sector: string
  industry: string
}

interface StockFundamentalsProps {
  data: StockData
}

export default function StockFundamentals({ data }: StockFundamentalsProps) {
  const isPositive = data.change >= 0

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Stock Fundamentals
        </h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">{data.symbol}</div>
          <div className="text-xs text-gray-500 truncate max-w-24">{data.name}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Price</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${data.price.toFixed(2)}</div>
            <div className={`flex items-center text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {isPositive ? "+" : ""}
              {data.change.toFixed(2)} ({data.changePercent})
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Market Cap</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">${(data.marketCap / 1e12).toFixed(2)}T</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">P/E Ratio</span>
          <span className="text-lg font-semibold text-gray-900">
            {typeof data.peRatio === "number" ? data.peRatio.toFixed(1) : data.peRatio}
          </span>
        </div>
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-600">EPS</span>
  <span className="text-lg font-semibold text-gray-900">${data.eps.toFixed(2)}</span>
</div>

<div className="flex items-center justify-between">
  <span className="text-sm text-gray-600">Beta</span>
  <span className="text-lg font-semibold text-gray-900">{data.beta.toFixed(2)}</span>
</div>

<div className="pt-4 border-t">
  <div className="text-xs text-gray-500 mb-2">Day Range</div>
  <div className="flex justify-between text-sm">
    <span>${data.dayLow.toFixed(2)}</span>
    <span>${data.dayHigh.toFixed(2)}</span>
  </div>
</div>

<div>
  <div className="text-xs text-gray-500 mb-2">52 Week Range</div>
  <div className="flex justify-between text-sm">
    <span>${data.yearLow.toFixed(2)}</span>
    <span>${data.yearHigh.toFixed(2)}</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <span className="text-sm text-gray-600">Volume</span>
  <span className="text-sm font-medium">{(data.volume / 1e6).toFixed(1)}M</span>
</div>
      </div>
    </div>
  )
}