import { useState, useEffect } from "react"
import StockSelector from "./components/stock-selector"
import BuzzMetrics from "./components/buzz-metrics"
import StockFundamentals from "./components/stock-fundamentals"
import HypeAnalysis from "./components/hype-analysis"
import NewsSentiment from "./components/news-sentiment"
import LoadingSpinner from "./components/loading-spinner"
import "./App.css"

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

function App() {
  const [selectedStock, setSelectedStock] = useState("")
  const [buzzData, setBuzzData] = useState<BuzzData | null>(null)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  const fetchAllData = async (symbol: string) => {
    setLoading(true)
    setError(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://techpulse-server-716503352822.us-central1.run.app'
      const [buzzRes, stockRes, newsRes] = await Promise.all([
        fetch(`${apiUrl}/api/reddit-buzz?keyword=${symbol}`),
        fetch(`${apiUrl}/api/stock-fundamentals?symbol=${symbol.toUpperCase()}`),
        fetch(`${apiUrl}/api/news-sentiment?symbol=${symbol.toUpperCase()}`)
      ])

      if (!buzzRes.ok || !stockRes.ok || !newsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const [buzz, stock, news] = await Promise.all([
        buzzRes.json(),
        stockRes.json(),
        newsRes.json()
      ])

      setBuzzData(buzz)
      setNewsData(news)

      const mappedStock: StockData = {
        symbol: stock.price?.symbol || symbol.toUpperCase(),
        name: stock.price?.longName || stock.summaryProfile?.longBusinessSummary || symbol.toUpperCase(),
        price: stock.price?.regularMarketPrice || 0,
        change: stock.price?.regularMarketChange || 0,
        changePercent: stock.price?.regularMarketChangePercent
          ? (stock.price.regularMarketChangePercent * 100).toFixed(2) + "%"
          : "0%",
        marketCap: stock.price?.marketCap || 0,
        peRatio: stock.financialData?.forwardPE || "N/A"
      }
      
      setStockData(mappedStock)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStockSelect = (stock: { symbol: string }) => {
    setSelectedStock(stock.symbol)
    fetchAllData(stock.symbol)
  }

  useEffect(() => {
    if (selectedStock) {
      fetchAllData(selectedStock)
    }
  }, [selectedStock])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [darkMode])

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-dark-bg text-white' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">TechPulse AI</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Real-time stock sentiment and hype analysis</p>
        </header>

        <StockSelector onSelectStock={handleStockSelect} defaultValue={selectedStock} />

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <>
            {stockData && <StockFundamentals data={stockData} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {buzzData && <BuzzMetrics data={buzzData} />}
              {buzzData?.hypeAnalysis && (
                <HypeAnalysis 
                  data={buzzData.hypeAnalysis} 
                  stockSymbol={selectedStock} 
                />
              )}
            </div>
            {newsData && <NewsSentiment data={newsData} />}
          </>
        )}
      </div>
    </div>
  )
}

export default App
