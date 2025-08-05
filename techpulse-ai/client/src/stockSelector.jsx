import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, TrendingUp, X } from 'lucide-react';

const StockSelector = ({ onSelectStock, defaultValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch stocks from backend
  useEffect(() => {
    fetchStocks();
  }, []);

  // Set default selection
  useEffect(() => {
    if (stocks.length > 0 && defaultValue && !selectedStock) {
      const defaultStock = stocks.find(stock => 
        stock.symbol.toLowerCase() === defaultValue.toLowerCase()
      );
      if (defaultStock) {
        setSelectedStock(defaultStock);
        setSearchTerm(defaultStock.symbol);
        onSelectStock(defaultStock);
      }
    }
  }, [stocks, defaultValue, selectedStock, onSelectStock]);

  // Debounced filtering function
  const debouncedFilter = useCallback((term, stockList) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (!term || term.trim().length === 0) {
        // Show popular/top stocks when no search term
        const popularStocks = stockList
          .filter(stock => ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD'].includes(stock.symbol))
          .concat(stockList.filter(stock => !['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD'].includes(stock.symbol)))
          .slice(0, 50);
        setFilteredStocks(popularStocks);
      } else {
        const trimmedTerm = term.trim().toLowerCase();
        const filtered = stockList
          .filter(stock => {
            const symbolMatch = stock.symbol.toLowerCase().includes(trimmedTerm);
            const nameMatch = stock.name.toLowerCase().includes(trimmedTerm);
            const exactSymbolMatch = stock.symbol.toLowerCase() === trimmedTerm;
            
            return symbolMatch || nameMatch || exactSymbolMatch;
          })
          .sort((a, b) => {
            // Prioritize exact symbol matches
            const aExact = a.symbol.toLowerCase() === trimmedTerm;
            const bExact = b.symbol.toLowerCase() === trimmedTerm;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then prioritize symbol starts with
            const aStartsWith = a.symbol.toLowerCase().startsWith(trimmedTerm);
            const bStartsWith = b.symbol.toLowerCase().startsWith(trimmedTerm);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            
            // Finally sort alphabetically
            return a.symbol.localeCompare(b.symbol);
          })
          .slice(0, 20);
        
        setFilteredStocks(filtered);
      }
    }, 150); // 150ms debounce
  }, []);

  // Filter stocks based on search term with debouncing
  useEffect(() => {
    debouncedFilter(searchTerm, stocks);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, stocks, debouncedFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search term to selected stock if user clicks away without selecting
        if (selectedStock && searchTerm !== selectedStock.symbol) {
          setSearchTerm(selectedStock.symbol);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStock, searchTerm]);

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/stocks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const stockList = data.stocks || [];
      setStocks(stockList);
      
      if (stockList.length === 0) {
        throw new Error('No stocks data received');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setError('Failed to load stocks data');
      // Fallback to popular stocks
      const fallbackStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
        { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
        { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
        { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology' },
        { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
        { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' }
      ];
      setStocks(fallbackStocks);
    }
    setLoading(false);
  };

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSearchTerm(stock.symbol);
    setIsOpen(false);
    setError(null);
    onSelectStock(stock);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!isOpen) {
      setIsOpen(true);
    }
    
    // Clear selection if user is typing something different
    if (selectedStock && value.toLowerCase() !== selectedStock.symbol.toLowerCase()) {
      setSelectedStock(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Select all text for easy replacement
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredStocks.length > 0) {
      e.preventDefault();
      handleSelectStock(filteredStocks[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && filteredStocks.length > 0) {
      e.preventDefault();
      // Focus first item in dropdown (would need more complex logic for full keyboard nav)
      setIsOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedStock(null);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const getSectorColor = (sector) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Financials': 'bg-yellow-100 text-yellow-800',
      'Consumer Discretionary': 'bg-purple-100 text-purple-800',
      'Consumer Staples': 'bg-orange-100 text-orange-800',
      'Energy': 'bg-red-100 text-red-800',
      'Industrials': 'bg-gray-100 text-gray-800',
      'Communication Services': 'bg-indigo-100 text-indigo-800',
      'ETF': 'bg-pink-100 text-pink-800',
      'Utilities': 'bg-teal-100 text-teal-800',
      'Materials': 'bg-amber-100 text-amber-800',
      'Real Estate': 'bg-emerald-100 text-emerald-800'
    };
    return colors[sector] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder="Search stocks (e.g., AAPL, Tesla)"
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all duration-200"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-1 mr-1 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <div className="pr-3 flex items-center">
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Selected Stock Info */}
      {selectedStock && !isOpen && !error && (
        <div className="mt-2 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="font-semibold text-gray-900">{selectedStock.symbol}</span>
                <TrendingUp className="h-3 w-3 text-green-500 ml-2 flex-shrink-0" />
              </div>
              <span className="text-gray-600 text-sm truncate block">{selectedStock.name}</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getSectorColor(selectedStock.sector)}`}>
              {selectedStock.sector}
            </span>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading stocks...
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>No stocks found for "{searchTerm}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching by symbol or company name</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {searchTerm.length === 0 && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                  Popular Stocks
                </div>
              )}
              {filteredStocks.map((stock, index) => (
                <div
                  key={`${stock.symbol}-${index}`}
                  onClick={() => handleSelectStock(stock)}
                  className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">{stock.symbol}</span>
                        <TrendingUp className="h-3 w-3 text-green-500 ml-2 flex-shrink-0" />
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {stock.name}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getSectorColor(stock.sector)}`}>
                      {stock.sector}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockSelector;