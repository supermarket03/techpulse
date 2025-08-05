"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Activity, Newspaper, AlertTriangle, Clock } from "lucide-react"
import StockSelector from "./components/stock-selector"
import BuzzMetrics from "./components/buzz-metrics"
import StockFundamentals from "./components/stock-fundamentals"
import HypeAnalysis from "./components/hype-analysis"
import NewsSentiment from "./components/news-sentiment"
import LoadingSpinner from "./components/loading-spinner"

interface BuzzData {
  keyword: string
  buzzCount: number
  upvotesTotal: number
  hypeAnalysis?: {
    socialHype: string
    fundamentalScore: string
    hypeRatio: string
    verdict: "OVERHYPED" | "UNDERVALUED" | "BALANCED"
  }
  timestamp: string
}

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: string
  marketCap: number
  peRatio: number | string
}

interface NewsData {
  articles: Array<{
    title: string
    link: string
    published: string
    sentiment: "positive" | "negative" | "neutral"
    confidence: number
    source: string
  }>
  avgSentiment: string
  overallSentiment: "Positive" | "Negative" | "Neutral"
  counts: {
    positive: number
    negative: number
    neutral: number
  }
  totalArticles: number
}

export default function TechPulseDashboard() {
  const [selectedStock, setSelectedStock] = useState("")
  const [buzzData, setBuzzData] = useState<BuzzData | null>(null)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = async (symbol: string) => {
    setLoading(true)
    setError(null)

    try {
      const [buzzRes, stockRes, newsRes] = await Promise.all([
        fetch(`http://localhost:4000/api/reddit-buzz?keyword=${symbol}`),
        fetch(`http://localhost:4000/api/stock-fundamentals?symbol=${symbol.toUpperCase()}`),
        fetch(`http://localhost:4000/api/news-sentiment?symbol=${symbol.toUpperCase()}`),
      ])

      if (!buzzRes.ok || !stockRes.ok || !newsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const [buzz, stock, news] = await Promise.all([buzzRes.json(), stockRes.json(), newsRes.json()])

      setBuzzData(buzz)
      setStockData(stock)
      setNewsData(news)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedStock) {
      fetchAllData(selectedStock)
    }
  }, [selectedStock])

  const handleStockSelect = (stock: { symbol: string }) => {
    setSelectedStock(stock.symbol)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TechPulse AI</h1>
                <p className="text-gray-600">Real-time Financial Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                Last updated: {buzzData?.timestamp ? new Date(buzzData.timestamp).toLocaleTimeString() : "Never"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Selector */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Select Stock to Analyze
            </h2>
            <StockSelector onSelectStock={handleStockSelect} defaultValue={selectedStock} />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-red-800 font-medium">Error Loading Data</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}

        {/* Main Dashboard */}
        {!loading && !error && buzzData && stockData && newsData && (
          <div className="space-y-8">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BuzzMetrics data={buzzData} />
              <StockFundamentals data={stockData} />
              <NewsSentiment data={newsData} />
            </div>

            {/* Hype Analysis */}
            {buzzData.hypeAnalysis && <HypeAnalysis data={buzzData.hypeAnalysis} stockSymbol={selectedStock} />}

            {/* Detailed News Analysis */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Newspaper className="h-5 w-5 mr-2 text-purple-600" />
                  Recent News Headlines
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {newsData.articles.slice(0, 8).map((article, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                          article.sentiment === "positive"
                            ? "bg-green-500"
                            : article.sentiment === "negative"
                              ? "bg-red-500"
                              : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-blue-600 font-medium line-clamp-2"
                        >
                          {article.title}
                        </a>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>{new Date(article.published).toLocaleDateString()}</span>
                          <span>•</span>
                          <span
                            className={`font-medium ${
                              article.sentiment === "positive"
                                ? "text-green-600"
                                : article.sentiment === "negative"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {article.sentiment.toUpperCase()} ({(article.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}