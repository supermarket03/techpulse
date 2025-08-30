// stock.js
const yahooFinance = require('yahoo-finance2').default;

/**
 * Get detailed stock fundamentals
 * Includes: price, profile, key financials
 */
async function getFundamentals(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryProfile',
        'financialData',
        'defaultKeyStatistics',
        'assetProfile',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory'
      ]
    });
    return result;
  } catch (err) {
    console.error(`Error fetching fundamentals for ${symbol}:`, err.message);
    throw err;
  }
}

/**
 * Search for stocks/tickers
 */
async function searchStocks(query) {
  try {
    const result = await yahooFinance.search(query);
    // Return simplified results
    return result.quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || '',
      exchange: q.exchange || '',
      type: q.quoteType || '',
      score: q.score || 0
    }));
  } catch (err) {
    console.error(`Error searching for stocks:`, err.message);
    throw err;
  }
}

/**
 * Get real-time quote data
 */
async function getQuote(symbol) {
  try {
    const result = await yahooFinance.quote(symbol);
    return result;
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err.message);
    throw err;
  }
}

module.exports = { getFundamentals, searchStocks, getQuote };
