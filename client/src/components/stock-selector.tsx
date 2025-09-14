"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, ChevronDown, TrendingUp, X } from "lucide-react"

interface Stock {
  symbol: string
  name: string
  sector: string
}

interface StockSelectorProps {
  onSelectStock: (stock: Stock) => void
  defaultValue?: string
}

declare global {
  interface ImportMetaEnv {
    VITE_API_URL: string
  }
}

export default function StockSelector({ onSelectStock, defaultValue = "" }: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [stocks, setStocks] = useState<Stock[]>([])
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  const apiUrl = import.meta.env.VITE_API_URL || 'https://techpulse-server-716503352822.us-central1.run.app'

  const searchStocks = async (query: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiUrl}/api/search-stocks?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name || stock.shortname || stock.longname || '',
        sector: stock.type || 'N/A'
      }))
    } catch (error) {
      console.error("Error searching stocks:", error)
      setError("Failed to search stocks")
      return []
    } finally {
      setLoading(false)
    }
  }

  // Initial stock load
  useEffect(() => {
    const loadInitialStocks = async () => {
      const defaultStocks = await searchStocks('AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA')
      setStocks(defaultStocks)
      setFilteredStocks(defaultStocks)

      if (defaultValue) {
        const defaultStock = defaultStocks.find(
          (stock) => stock.symbol.toLowerCase() === defaultValue.toLowerCase()
        )
        if (defaultStock) {
          setSelectedStock(defaultStock)
          setSearchTerm(defaultStock.symbol)
          onSelectStock(defaultStock)
        }
      }
    }

    loadInitialStocks()
  }, [defaultValue, onSelectStock])

  // Handle search with debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!searchTerm.trim()) {
      setFilteredStocks(stocks)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchStocks(searchTerm)
      setFilteredStocks(results)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, stocks])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (selectedStock && searchTerm !== selectedStock.symbol) {
          setSearchTerm(selectedStock.symbol)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [selectedStock, searchTerm])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
    setIsOpen(true)
  }

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock)
    setSearchTerm(stock.symbol)
    setIsOpen(false)
    onSelectStock(stock)
  }

  const handleClearSelection = () => {
    setSelectedStock(null)
    setSearchTerm("")
    setIsOpen(true)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stocks..."
          className="w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        {selectedStock && (
          <button
            onClick={handleClearSelection}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg dark:bg-gray-800 border dark:border-gray-700"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : filteredStocks.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No stocks found</div>
          ) : (
            <ul className="max-h-60 overflow-auto">
              {filteredStocks.map((stock) => (
                <li
                  key={stock.symbol}
                  onClick={() => handleStockSelect(stock)}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium dark:text-white">{stock.symbol}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{stock.name}</span>
                  </div>
                  {stock.sector && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{stock.sector}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
