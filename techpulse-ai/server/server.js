const express = require('express');
const cors = require('cors');
const axios = require('axios');
const natural = require('natural');
const aposToLexForm = require('apos-to-lex-form');
const { WordTokenizer } = natural;
const tokenizer = new WordTokenizer();
const { loadStockDatabase, searchStocks } = require('./stock');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const CLIENT_ID = process.env.REDDIT_CLIENT_ID || 'g3hng_FCBU59nBXhF4o13w';
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '763kiJmyIAU-tp5KZy7PK2boVAgs3A';
const USERNAME = process.env.REDDIT_USERNAME || 'savelol18';
const PASSWORD = process.env.REDDIT_PASSWORD || 'Marktomi1';
const USER_AGENT = process.env.REDDIT_USER_AGENT || 'rhungaryscrape/0.1 by savelol18';
const FMP_API_KEY = process.env.FMP_API_KEY || 'bX6DW8z0fXwovmSD4RKwFrFCrj9vl2ST';
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'a1a73e0f5d4e471eab33bdc0c6f88fa2';

let accessToken = null;
let tokenExpiry = null;

// Reddit OAuth token function
async function getAccessToken() {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      `grant_type=password&username=${USERNAME}&password=${PASSWORD}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return accessToken;
  } catch (error) {
    console.error('Error getting Reddit access token:', error);
    throw error;
  }
}

// Sentiment Analysis function using natural
function analyzeSentiment(text) {
  const lexed = aposToLexForm(text);
  const casedText = lexed.toLowerCase();
  const alphaOnlyText = casedText.replace(/[^a-zA-Z\s]+/g, '');
  
  const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  const tokens = tokenizer.tokenize(alphaOnlyText);
  const sentiment = analyzer.getSentiment(tokens);
  
  let result = {
    sentiment: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral',
    confidence: Math.abs(sentiment),
    scores: {
      positive: Math.max(sentiment, 0),
      negative: Math.abs(Math.min(sentiment, 0)),
      neutral: 1 - Math.abs(sentiment)
    }
  };
  
  return result;
}

// Reddit API endpoint
app.get('/api/reddit-buzz', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }

    const token = await getAccessToken();
    const subreddits = ['wallstreetbets', 'stocks', 'investing', 'stockmarket'];
    const posts = [];

    for (const subreddit of subreddits) {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/search`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': USER_AGENT
          },
          params: {
            q: keyword,
            t: 'week',
            limit: 25,
            sort: 'relevance'
          }
        }
      );

      posts.push(...response.data.data.children.map(post => ({
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        score: post.data.score,
        comments: post.data.num_comments,
        created: post.data.created_utc * 1000,
        subreddit: post.data.subreddit
      })));
    }

    // Calculate buzz metrics
    const totalMentions = posts.length;
    const totalScore = posts.reduce((sum, post) => sum + post.score, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
    const averageScore = totalMentions > 0 ? totalScore / totalMentions : 0;
    const averageComments = totalMentions > 0 ? totalComments / totalMentions : 0;

    res.json({
      timestamp: Date.now(),
      posts,
      metrics: {
        totalMentions,
        totalScore,
        totalComments,
        averageScore,
        averageComments
      }
    });
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    res.status(500).json({ error: 'Failed to fetch Reddit data' });
  }
});

// Stock fundamentals endpoint
app.get('/api/stock-fundamentals', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const [quote, profile] = await Promise.all([
      axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`),
      axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`)
    ]);

    if (!quote.data[0] || !profile.data[0]) {
      return res.status(404).json({ error: 'Stock data not found' });
    }

    const stockData = {
      ...quote.data[0],
      ...profile.data[0]
    };

    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// News sentiment endpoint
app.get('/api/news-sentiment', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const newsResponse = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: `${symbol} stock`,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 50,
          apiKey: NEWS_API_KEY
        }
      }
    );

    const articles = await Promise.all(
      newsResponse.data.articles.map(async article => {
        const sentimentResult = analyzeSentiment(article.title + ' ' + (article.description || ''));
        return {
          title: article.title,
          link: article.url,
          published: article.publishedAt,
          source: article.source.name,
          sentiment: sentimentResult.sentiment,
          confidence: sentimentResult.confidence
        };
      })
    );

    // Calculate overall sentiment
    const sentimentCounts = articles.reduce((acc, article) => {
      acc[article.sentiment]++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const totalArticles = articles.length;
    const avgSentiment = articles.reduce((sum, article) => {
      return sum + (article.sentiment === 'positive' ? 1 : article.sentiment === 'negative' ? -1 : 0);
    }, 0) / totalArticles;

    res.json({
      articles,
      avgSentiment: avgSentiment.toFixed(2),
      overallSentiment: avgSentiment > 0.1 ? 'Positive' : avgSentiment < -0.1 ? 'Negative' : 'Neutral',
      counts: sentimentCounts,
      totalArticles
    });
  } catch (error) {
    console.error('Error analyzing news:', error);
    res.status(500).json({ error: 'Failed to analyze news' });
  }
});

// Stock search endpoint
app.get('/api/search-stocks', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await searchStocks(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  loadStockDatabase(); // Load stock database on startup
});
