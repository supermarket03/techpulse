// stock.js
const yahooFinance = require('yahoo-finance2').default;

/**
 * Get detailed stock fundamentals
 * Includes: price, profile, key financials
 */
async function getFundamentals(symbol) {
  try {
    console.log(`[getFundamentals] Fetching data for symbol: ${symbol}`);
    
    // Get quote summary data
    console.log(`[getFundamentals] Fetching quoteSummary data...`);
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryProfile',
        'financialData',
        'defaultKeyStatistics',
        'assetProfile'
      ]
    });
    console.log(`[getFundamentals] Successfully fetched quoteSummary data`);

    // Get real-time quote data
    console.log(`[getFundamentals] Fetching quote data...`);
    const quote = await yahooFinance.quote(symbol);
    console.log(`[getFundamentals] Successfully fetched quote data`);
    
    // Get financials data using fundamentalsTimeSeries
    console.log(`[getFundamentals] Fetching fundamentalsTimeSeries data...`);
    const financials = await yahooFinance.fundamentalsTimeSeries(symbol, {
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      endDate: new Date(),
      type: "quarterly"
    });
    console.log(`[getFundamentals] Successfully fetched fundamentalsTimeSeries data`);

    // Log response structure
    console.log(`[getFundamentals] Response structure:`, {
      quoteSummaryKeys: Object.keys(result || {}),
      quoteKeys: Object.keys(quote || {}),
      financialsKeys: Object.keys(financials || {})
    });

    // Combine the data
    return {
      ...result,
      quote,
      financials
    };
  } catch (err) {
    console.error(`[getFundamentals] Error fetching fundamentals for ${symbol}:`, {
      error: err.message,
      stack: err.stack,
      symbol: symbol,
      errorType: err.constructor.name
    });
    throw err;
  }
}

/**
 * Search for stocks/tickers
 * Enhanced to provide better search results with fuzzy matching
 */
async function searchStocks(query) {
  try {
    const result = await yahooFinance.search(query, {
      enableFuzzyQuery: true, // Allow for typos and partial matches
      quotesCount: 10, // Get more results
      newsCount: 0 // Skip news results for better performance
    });
    
    // Return simplified results with more fields
    return result.quotes
      .filter(q => q.isYahooFinance !== false) // Filter out non-Yahoo Finance results
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || '',
        exchange: q.exchange || '',
        type: q.quoteType || '',
        score: q.score || 0,
        sector: q.sector || '',
        industry: q.industry || ''
      }));
  } catch (err) {
    console.error(`Error searching for stocks:`, err.message);
    throw err;
  }
}

/**
 * Get real-time quote data with specified fields
 */
async function getQuote(symbol) {
  try {
    const result = await yahooFinance.quote(symbol, {
      fields: [
        'symbol',
        'regularMarketPrice',
        'regularMarketChange',
        'regularMarketChangePercent',
        'regularMarketVolume',
        'regularMarketDayHigh',
        'regularMarketDayLow',
        'regularMarketOpen',
        'regularMarketPreviousClose',
        'marketCap',
        'currency'
      ]
    });
    return result;
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err.message);
    throw err;
  }
}

module.exports = { getFundamentals, searchStocks, getQuote };
