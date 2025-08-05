// stocks.js - Stock database management
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Your existing FMP API key
const FMP_API_KEY = 'bX6DW8z0fXwovmSD4RKwFrFCrj9vl2ST';
const STOCKS_FILE = path.join(__dirname, 'stocks_database.json');

// Curated list of top traded stocks (mix of S&P 500, NASDAQ 100, and popular international)
const CURATED_STOCKS = [
  // Tech Giants
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', exchange: 'NASDAQ' },
  
  // Semiconductors
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'QCOM', name: 'Qualcomm Incorporated', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  
  // Finance
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', exchange: 'NYSE' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financials', exchange: 'NYSE' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financials', exchange: 'NYSE' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financials', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', exchange: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Financials', exchange: 'NYSE' },
  
  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', exchange: 'NYSE' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Healthcare', exchange: 'NYSE' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', exchange: 'NYSE' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', exchange: 'NYSE' },
  
  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', exchange: 'NYSE' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', exchange: 'NYSE' },
  
  // Consumer
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', exchange: 'NYSE' },
  { symbol: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples', exchange: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Staples', exchange: 'NYSE' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples', exchange: 'NASDAQ' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples', exchange: 'NASDAQ' },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary', exchange: 'NYSE' },
  { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Discretionary', exchange: 'NYSE' },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary', exchange: 'NYSE' },
  
  // Industrial
  { symbol: 'BA', name: 'Boeing Company', sector: 'Industrials', exchange: 'NYSE' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', exchange: 'NYSE' },
  { symbol: 'GE', name: 'General Electric Company', sector: 'Industrials', exchange: 'NYSE' },
  
  // Communication
  { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services', exchange: 'NYSE' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', exchange: 'NYSE' },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services', exchange: 'NYSE' },
  
  // Meme/Popular Stocks
  { symbol: 'GME', name: 'GameStop Corp.', sector: 'Consumer Discretionary', exchange: 'NYSE' },
  { symbol: 'AMC', name: 'AMC Entertainment Holdings Inc.', sector: 'Communication Services', exchange: 'NYSE' },
  { symbol: 'BB', name: 'BlackBerry Limited', sector: 'Technology', exchange: 'NYSE' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'Technology', exchange: 'NYSE' },
  
  // Crypto-related
  { symbol: 'COIN', name: 'Coinbase Global Inc.', sector: 'Financials', exchange: 'NASDAQ' },
  { symbol: 'MSTR', name: 'MicroStrategy Incorporated', sector: 'Technology', exchange: 'NASDAQ' },
  
  // Popular ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF', exchange: 'NYSE' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', exchange: 'NASDAQ' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'ETF', exchange: 'NYSE' },
  
  // International
  { symbol: 'BABA', name: 'Alibaba Group Holding Limited', sector: 'Consumer Discretionary', exchange: 'NYSE' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing', sector: 'Technology', exchange: 'NYSE' },
  { symbol: 'ASML', name: 'ASML Holding N.V.', sector: 'Technology', exchange: 'NASDAQ' }
];

// Function to fetch S&P 500 list from FMP
async function fetchSP500List() {
  try {
    console.log('Fetching S&P 500 list from FMP...');
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/sp500_constituent?apikey=${FMP_API_KEY}`);
    
    return response.data.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector || 'Unknown',
      exchange: 'SP500'
    }));
  } catch (error) {
    console.error('Error fetching S&P 500 list:', error.message);
    return [];
  }
}

// Function to fetch NASDAQ 100 list from FMP
async function fetchNASDAQ100List() {
  try {
    console.log('Fetching NASDAQ 100 list from FMP...');
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/nasdaq_constituent?apikey=${FMP_API_KEY}`);
    
    return response.data.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector || 'Unknown',
      exchange: 'NASDAQ100'
    }));
  } catch (error) {
    console.error('Error fetching NASDAQ 100 list:', error.message);
    return [];
  }
}

// Function to fetch most active stocks from FMP
async function fetchMostActiveStocks() {
  try {
    console.log('Fetching most active stocks from FMP...');
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${FMP_API_KEY}`);
    
    return response.data.slice(0, 100).map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: 'Active',
      exchange: stock.exchange || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching most active stocks:', error.message);
    return [];
  }
}

// Function to build comprehensive stock database
async function buildStockDatabase() {
  console.log('Building comprehensive stock database...');
  
  try {
    const [sp500Stocks, nasdaq100Stocks, activeStocks] = await Promise.all([
      fetchSP500List(),
      fetchNASDAQ100List(),
      fetchMostActiveStocks()
    ]);
    
    // Combine all lists and remove duplicates
    const allStocks = [...CURATED_STOCKS, ...sp500Stocks, ...nasdaq100Stocks, ...activeStocks];
    
    // Remove duplicates based on symbol
    const uniqueStocks = allStocks.reduce((acc, stock) => {
      const existing = acc.find(s => s.symbol === stock.symbol);
      if (!existing) {
        acc.push(stock);
      } else {
        // Keep the one with more complete information
        if (stock.name && stock.name.length > existing.name.length) {
          const index = acc.findIndex(s => s.symbol === stock.symbol);
          acc[index] = stock;
        }
      }
      return acc;
    }, []);
    
    // Sort alphabetically by symbol
    uniqueStocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    // Save to file
    const stockDatabase = {
      lastUpdated: new Date().toISOString(),
      totalStocks: uniqueStocks.length,
      stocks: uniqueStocks
    };
    
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stockDatabase, null, 2));
    console.log(`Stock database built successfully! Total stocks: ${uniqueStocks.length}`);
    
    return stockDatabase;
    
  } catch (error) {
    console.error('Error building stock database:', error.message);
    
    // Fallback to curated list only
    const fallbackDatabase = {
      lastUpdated: new Date().toISOString(),
      totalStocks: CURATED_STOCKS.length,
      stocks: CURATED_STOCKS,
      fallback: true
    };
    
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(fallbackDatabase, null, 2));
    return fallbackDatabase;
  }
}

// Function to load stock database
function loadStockDatabase() {
  try {
    if (fs.existsSync(STOCKS_FILE)) {
      const data = fs.readFileSync(STOCKS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading stock database:', error.message);
  }
  
  // Return curated list as fallback
  return {
    lastUpdated: new Date().toISOString(),
    totalStocks: CURATED_STOCKS.length,
    stocks: CURATED_STOCKS,
    fallback: true
  };
}

// Function to search stocks
function searchStocks(query, limit = 20) {
  const db = loadStockDatabase();
  const searchTerm = query.toLowerCase();
  
  const matches = db.stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm) || 
    stock.name.toLowerCase().includes(searchTerm)
  );
  
  return matches.slice(0, limit);
}

// Initialize database on startup (can be run periodically)
async function initializeDatabase() {
  const db = loadStockDatabase();
  
  // Check if database is older than 24 hours
  const lastUpdated = new Date(db.lastUpdated);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  if (lastUpdated < dayAgo || db.fallback) {
    console.log('Stock database is outdated or fallback, rebuilding...');
    return await buildStockDatabase();
  }
  
  console.log(`Stock database loaded: ${db.totalStocks} stocks`);
  return db;
}

module.exports = {
  initializeDatabase,
  loadStockDatabase,
  searchStocks,
  buildStockDatabase
};