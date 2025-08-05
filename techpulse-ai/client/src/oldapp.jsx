import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StockSelector from './stockSelector';

function App() {
  const [inputValue, setInputValue] = useState('amd'); // controlled input value
  const [keyword, setKeyword] = useState('amd'); // actual keyword to fetch
  const [buzzData, setBuzzData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [newsData, setNewsData] = useState(null);

// Function to fetch buzz, stock, and news data
async function fetchBuzz() {
  setLoading(true);
  try {
    // Fetch Reddit buzz
    const buzzRes = await fetch(`http://localhost:4000/api/reddit-buzz?keyword=${keyword}`);
    if (!buzzRes.ok) throw new Error('Failed to fetch buzz data');
    const buzzData = await buzzRes.json();
    setBuzzData(buzzData);

    // Fetch stock fundamentals
    const stockRes = await fetch(`http://localhost:4000/api/stock-fundamentals?symbol=${keyword.toUpperCase()}`);
    if (!stockRes.ok) throw new Error('Failed to fetch stock data');
    const stockData = await stockRes.json();
    setStockData(stockData);

    // Fetch news sentiment
    const newsRes = await fetch(`http://localhost:4000/api/news-sentiment?symbol=${keyword.toUpperCase()}`);
    if (!newsRes.ok) throw new Error('Failed to fetch news data');
    const newsData = await newsRes.json();
    setNewsData(newsData);

  } catch (err) {
    console.error(err);
    setBuzzData(null);
    setStockData(null);
    setNewsData(null);
  }
  setLoading(false);
}

  // Call fetchBuzz whenever keyword changes
  React.useEffect(() => {
    fetchBuzz();
  }, [keyword]);

  return (
    <div style={{ padding: 20 }}>
      <h1>TechPulse AI: Reddit Buzz</h1>

      <StockSelector 
  onSelectStock={(stock) => setKeyword(stock.symbol)}
  defaultValue=""
/>

      {loading && <p>Loading buzz data...</p>}

      {buzzData && !loading && (
  <>
    <div>
      <p><strong>Keyword:</strong> {buzzData.keyword}</p>
      <p><strong>Posts in last 7 days:</strong> {buzzData.buzzCount}</p>
      <p><strong>Total upvotes:</strong> {buzzData.upvotesTotal}</p>
    </div>
{stockData && !loading && (
  <div style={{ marginTop: 20, padding: 15, border: '2px solid #2196F3', borderRadius: 8, backgroundColor: '#f8f9fa' }}>
    <h3>📊 Stock Fundamentals: {stockData.name}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginTop: 10 }}>
      <div>
        <strong>Price:</strong> ${stockData.price}
        <br />
        <span style={{ color: stockData.change >= 0 ? 'green' : 'red' }}>
          {stockData.change >= 0 ? '+' : ''}{stockData.change} ({stockData.changePercent})
        </span>
      </div>
      <div>
        <strong>Market Cap:</strong><br />
        ${(stockData.marketCap / 1e12).toFixed(2)}T
      </div>
      <div>
        <strong>P/E Ratio:</strong><br />
        {stockData.peRatio}
      </div>
    </div>
  </div>
)}
{buzzData && buzzData.hypeAnalysis && !loading && (
  <div style={{ 
    marginTop: 20, 
    padding: 15, 
    border: '2px solid #FF9800', 
    borderRadius: 8, 
    backgroundColor: buzzData.hypeAnalysis.verdict === 'OVERHYPED' ? '#ffebee' : 
                     buzzData.hypeAnalysis.verdict === 'UNDERVALUED' ? '#e8f5e8' : '#fff3e0'
  }}>
    <h3>🔥 Hype vs Reality Analysis</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginTop: 10 }}>
      <div>
        <strong>Social Hype Score:</strong><br />
        {buzzData.hypeAnalysis.socialHype}/10
      </div>
      <div>
        <strong>Fundamental Score:</strong><br />
        {buzzData.hypeAnalysis.fundamentalScore}/10
      </div>
      <div>
        <strong>Verdict:</strong><br />
        <span style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: buzzData.hypeAnalysis.verdict === 'OVERHYPED' ? 'red' : 
                 buzzData.hypeAnalysis.verdict === 'UNDERVALUED' ? 'green' : 'orange'
        }}>
          {buzzData.hypeAnalysis.verdict}
        </span>
      </div>
    </div>
    <p style={{ marginTop: 10, fontStyle: 'italic' }}>
      Hype Ratio: {buzzData.hypeAnalysis.hypeRatio} 
      {buzzData.hypeAnalysis.verdict === 'OVERHYPED' && ' - High social buzz vs fundamentals'}
      {buzzData.hypeAnalysis.verdict === 'UNDERVALUED' && ' - Low buzz but solid fundamentals'}
      {buzzData.hypeAnalysis.verdict === 'BALANCED' && ' - Social interest matches fundamentals'}
    </p>
  </div>
)}
{newsData && !loading && (
  <div style={{ 
    marginTop: 20, 
    padding: 15, 
    border: '2px solid #9C27B0', 
    borderRadius: 8, 
    backgroundColor: newsData.overallSentiment === 'Positive' ? '#e8f5e8' : 
                     newsData.overallSentiment === 'Negative' ? '#ffebee' : '#f5f5f5'
  }}>
    <h3>📰 News Sentiment Analysis</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginTop: 10 }}>
      <div>
        <strong>Articles Analyzed:</strong><br />
        {newsData.totalArticles}
      </div>
      <div>
        <strong>Overall Sentiment:</strong><br />
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: newsData.overallSentiment === 'Positive' ? 'green' : 
                 newsData.overallSentiment === 'Negative' ? 'red' : 'gray'
        }}>
          {newsData.overallSentiment}
        </span>
      </div>
      <div>
        <strong>Sentiment Score:</strong><br />
        {newsData.avgSentiment}
      </div>
      <div>
        <strong>Distribution:</strong><br />
        ✅{newsData.counts.positive} ❌{newsData.counts.negative} ⚪{newsData.counts.neutral}
      </div>
    </div>
    
    <h4 style={{ marginTop: 15, marginBottom: 10 }}>Recent Headlines:</h4>
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {newsData.articles.slice(0, 5).map((article, index) => (
        <div key={index} style={{ 
          padding: '8px', 
          marginBottom: '8px', 
          backgroundColor: 'white', 
          borderRadius: '4px',
          borderLeft: `4px solid ${article.sentiment === 'positive' ? 'green' : article.sentiment === 'negative' ? 'red' : 'gray'}`
        }}>
          <a href={article.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'black' }}>
            <strong>{article.title}</strong>
          </a>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {article.sentiment.toUpperCase()} ({article.score}) • {new Date(article.published).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={[
          { name: 'Posts', value: buzzData.buzzCount },
          { name: 'Upvotes', value: buzzData.upvotesTotal }
        ]}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  </>
)}
    </div>
  );
}

export default App;