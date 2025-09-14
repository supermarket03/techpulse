const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 4000;
const Parser = require('rss-parser');
const parser = new Parser();
const { loadStockDatabase, searchStocks } = require('./stock');

// Enable CORS for all routes (allows React app to connect)
app.use(cors());
app.use(express.json());

// Reddit OAuth credentials
const CLIENT_ID = 'g3hng_FCBU59nBXhF4o13w';
const CLIENT_SECRET = '763kiJmyIAU-tp5KZy7PK2boVAgs3A';
const USERNAME = 'savelol18';
const PASSWORD = 'Marktomi1';
const USER_AGENT = 'rhungaryscrape/0.1 by savelol18';
const FMP_API_KEY = 'bX6DW8z0fXwovmSD4RKwFrFCrj9vl2ST';
const NEWS_API_KEY = 'a1a73e0f5d4e471eab33bdc0c6f88fa2';

let accessToken = null;
let tokenExpiry = null;



// Function to get OAuth token from Reddit
async function getAccessToken() {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    console.log('Using cached access token');
    return accessToken;
  }
  
  console.log('Fetching new access token...');
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    const res = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'password',
        username: USERNAME,
        password: PASSWORD,
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = res.data.access_token;
    tokenExpiry = Date.now() + res.data.expires_in * 1000 - 60000; // 1 min early refresh
    console.log('Access token obtained successfully');
    return accessToken;
  } catch (err) {
    console.error('Failed to get access token:', err.response?.data || err.message);
    throw err;
  }
}

const subreddits = [
  "personalfinance", "finance", "financialplanning", "financialindependence",
  "stocks", "investing", "wallstreetbets"
];

async function fetchNewsAPI(symbol) {
  const apiKey = NEWS_API_KEY;

  const companyNameMapping = {
    MSFT: 'Microsoft',
    AAPL: 'Apple',
    NVDA: 'Nvidia',
    AMD: 'Advanced Micro Devices',
    // add more if needed
  };

  const companyName = companyNameMapping[symbol.toUpperCase()] || '';
  const query = `${symbol} OR "${companyName}"`;

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;
    const response = await axios.get(url);

    const articles = response.data.articles.map(article => ({
      title: article.title,
      content: article.description || '',
      link: article.url,
      published: article.publishedAt,
      source: article.source.name,
      weight: 1.0
    }));

    return articles;
  } catch (error) {
    console.error('Error fetching NewsAPI articles:', error.message);
    return [];
  }
}

// Helper function to fetch buzz count for a keyword from Reddit API
async function fetchBuzzCount(keyword, token) {
  let buzzCount = 0;
  let upvotesTotal = 0;

  console.log(`Searching for keyword: ${keyword}`);

  for (const sub of subreddits) {
    try {
      console.log(`Searching r/${sub}...`);
      
      const res = await axios.get(`https://oauth.reddit.com/r/${sub}/search`, {
        headers: {
          Authorization: `bearer ${token}`,
          'User-Agent': USER_AGENT,
        },
        params: {
          q: keyword,
          sort: 'new',
          limit: 100,
          restrict_sr: true,
          t: 'week',
        },
      });

      const posts = res.data.data.children;
      const subBuzzCount = posts.length;
      let subUpvotes = 0;
      
      for (const post of posts) {
        subUpvotes += post.data.ups || 0;
      }
      
      buzzCount += subBuzzCount;
      upvotesTotal += subUpvotes;
      
      console.log(`r/${sub}: ${subBuzzCount} posts, ${subUpvotes} upvotes`);
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error(`Error fetching data from r/${sub}:`, err.response?.data || err.message);
      // Continue to next subreddit
    }
  }
  
  console.log(`Total: ${buzzCount} posts, ${upvotesTotal} upvotes`);
  return { buzzCount, upvotesTotal };
}
// API endpoint: GET /api/stocks - Get all stocks
app.get('/api/stocks', (req, res) => {
  try {
    const db = loadStockDatabase();
    res.json(db);
  } catch (err) {
    console.error('Error loading stocks:', err.message);
    res.status(500).json({ error: 'Failed to load stocks' });
  }
});

// API endpoint: GET /api/stocks/search?q=apple - Search stocks
app.get('/api/stocks/search', (req, res) => {
  const query = req.query.q || '';
  try {
    const results = searchStocks(query);
    res.json({ stocks: results });
  } catch (err) {
    console.error('Error searching stocks:', err.message);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Helper function to fetch stock fundamentals from Financial Modeling Prep
async function fetchStockFundamentals(symbol) {
  try {
    // Get quote data
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
    const quoteRes = await axios.get(quoteUrl);
    const quote = quoteRes.data[0];
    
    if (!quote) throw new Error('No quote data found');

    // Get company profile for additional data
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`;
    const profileRes = await axios.get(profileUrl);
    const profile = profileRes.data[0];

    return {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage.toFixed(2) + '%',
      marketCap: profile.mktCap,
      peRatio: quote.pe || 'N/A',
      revenue: profile.volAvg || 'N/A',
      profitMargin: 'N/A', // Would need additional API call
      name: profile.companyName
    };
  } catch (err) {
    console.error('Error fetching FMP data:', err.message);
    throw err;
  }
}

// Function to calculate hype vs reality score
function calculateHypeScore(buzzData, stockData) {
  // Simple hype scoring algorithm
  const buzzScore = Math.min(buzzData.buzzCount / 10, 10); // Cap at 10
  const upvoteScore = Math.min(buzzData.upvotesTotal / 1000, 10); // Cap at 10
  const socialHype = (buzzScore + upvoteScore) / 2;
  
  // Reality score based on fundamentals
  const peScore = stockData.peRatio > 50 ? 2 : stockData.peRatio > 30 ? 5 : 8; // Lower P/E = better
  const marketCapScore = stockData.marketCap > 1e12 ? 8 : 5; // Large cap = more stable
  const fundamentalScore = (peScore + marketCapScore) / 2;
  
  const hypeRatio = socialHype / fundamentalScore;
  
  return {
    socialHype: socialHype.toFixed(1),
    fundamentalScore: fundamentalScore.toFixed(1),
    hypeRatio: hypeRatio.toFixed(2),
    verdict: hypeRatio > 1.5 ? "OVERHYPED" : hypeRatio < 0.8 ? "UNDERVALUED" : "BALANCED"
  };
}

async function fetchNewsSentiment(symbol) {
  try {
    // Existing RSS sources
    const rssSources = [
      { name: 'Yahoo Finance', url: `https://finance.yahoo.com/rss/headline?s=${symbol}`, weight: 1.0 },
      { name: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories', weight: 1.2 },
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', weight: 1.3 },
      { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', weight: 1.3 },
      { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', weight: 1.1 },
      { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', weight: 1.2 }
    ];

    const relevantArticles = [];
    const companyKeywords = [symbol.toLowerCase()];
    if (symbol === 'NVDA') companyKeywords.push('nvidia');
    if (symbol === 'AAPL') companyKeywords.push('apple');
    if (symbol === 'AMD') companyKeywords.push('advanced micro devices');
    if (symbol === 'MSFT') companyKeywords.push('microsoft');
    // Add more mappings as needed

    // Fetch from RSS sources
    for (const source of rssSources) {
      try {
        const feed = await parser.parseURL(source.url);
        for (const item of feed.items.slice(0, 10)) {
          const title = item.title.toLowerCase();
          const content = (item.contentSnippet || item.content || '').toLowerCase();
          
          const isRelevant = companyKeywords.some(keyword => 
            title.includes(keyword) || content.includes(keyword)
          );
          
          if (isRelevant) {
            relevantArticles.push({
              title: item.title,
              content: item.contentSnippet || item.content || '',
              link: item.link,
              published: item.pubDate,
              source: source.name,
              weight: source.weight
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching ${source.name}:`, err.message);
      }
    }

    // Fetch from NewsAPI
    const newsApiArticles = await fetchNewsAPI(symbol);
    // Filter NewsAPI articles by keywords as well, to be consistent
    for (const article of newsApiArticles) {
      const title = article.title.toLowerCase();
      const content = (article.content || '').toLowerCase();

      const isRelevant = companyKeywords.some(keyword => 
        title.includes(keyword) || content.includes(keyword)
      );

      if (isRelevant) {
        relevantArticles.push(article);
      }
    }

    // Continue with your existing sentiment analysis flow...
    if (relevantArticles.length === 0) {
      return {
        articles: [],
        avgSentiment: 0,
        overallSentiment: 'Neutral',
        counts: { positive: 0, negative: 0, neutral: 0 },
        totalArticles: 0,
        sourceBreakdown: {},
        usingFinBERT: true
      };
    }

    // Prepare texts for FinBERT analysis
    const textsForAnalysis = relevantArticles.map(article => 
      `${article.title}. ${article.content}`.substring(0, 500)
    );

    // Call Python FinBERT service
    const finbertResponse = await axios.post('http://localhost:5001/analyze-sentiment', {
      texts: textsForAnalysis
    });

    const sentimentResults = finbertResponse.data.results;

    // Combine articles with FinBERT results
    const analyzedArticles = [];
    let totalSentiment = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (let i = 0; i < relevantArticles.length; i++) {
      const article = relevantArticles[i];
      const sentiment = sentimentResults[i];
      
      // Weight the sentiment by source credibility
      const weightedConfidence = sentiment.confidence * (article.weight || 1);

      if (sentiment.sentiment === 'positive') {
        totalSentiment += weightedConfidence;
        positiveCount++;
      } else if (sentiment.sentiment === 'negative') {
        totalSentiment -= weightedConfidence;
        negativeCount++;
      } else {
        neutralCount++;
      }

      analyzedArticles.push({
        title: article.title,
        link: article.link,
        published: article.published,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        scores: sentiment.scores,
        source: article.source,
        finbertAnalysis: true
      });
    }

    const avgSentiment = analyzedArticles.length > 0 ? totalSentiment / analyzedArticles.length : 0;
    const overallSentiment = avgSentiment > 0.1 ? 'Positive' : avgSentiment < -0.1 ? 'Negative' : 'Neutral';

    return {
      articles: analyzedArticles.slice(0, 15),
      avgSentiment: avgSentiment.toFixed(3),
      overallSentiment: overallSentiment,
      counts: { positive: positiveCount, negative: negativeCount, neutral: neutralCount },
      totalArticles: analyzedArticles.length,
      usingFinBERT: true
    };

  } catch (err) {
    console.error('Error with FinBERT sentiment analysis:', err.message);
    return null;
  }
}

// API endpoint: GET /api/reddit-buzz?keyword=nvidia
app.get('/api/reddit-buzz', async (req, res) => {
  const keyword = req.query.keyword || 'nvidia';
  
  console.log(`API request received for keyword: ${keyword}`);

  try {
    const token = await getAccessToken();
    const buzzData = await fetchBuzzCount(keyword, token);
    
    // Also fetch stock data for hype analysis
    let hypeAnalysis = null;
    try {
      const stockData = await fetchStockFundamentals(keyword.toUpperCase());
      hypeAnalysis = calculateHypeScore(buzzData, stockData);
    } catch (err) {
      console.log('Could not fetch stock data for hype analysis');
    }
    
    const response = { 
      keyword, 
      ...buzzData,
      hypeAnalysis,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('API Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch Reddit buzz',
      details: err.message 
    });
  }
});

// API endpoint: GET /api/stock-fundamentals?symbol=NVDA
app.get('/api/stock-fundamentals', async (req, res) => {
  const symbol = req.query.symbol || 'NVDA';
  
  console.log(`Stock fundamentals request for: ${symbol}`);

  try {
    const data = await fetchStockFundamentals(symbol);
    console.log('Stock data retrieved:', data);
    res.json(data);
  } catch (err) {
    console.error('Stock API Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch stock fundamentals',
      details: err.message 
    });
  }
});

// API endpoint: GET /api/news-sentiment?symbol=NVDA
app.get('/api/news-sentiment', async (req, res) => {
  const symbol = req.query.symbol || 'NVDA';
  
  console.log(`News sentiment request for: ${symbol}`);

  try {
    const data = await fetchNewsSentiment(symbol);
    if (data) {
      res.json(data);
    } else {
      res.status(500).json({ error: 'Failed to fetch news sentiment' });
    }
  } catch (err) {
    console.error('News Sentiment API Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch news sentiment',
      details: err.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Reddit buzz API running on http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});