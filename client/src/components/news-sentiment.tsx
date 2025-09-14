"use client"
import { useState } from "react"
import ArticleCard from "./article-cards"
import { Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react"

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

interface NewsSentimentProps {
  data: NewsData
}

export default function NewsSentiment({ data }: NewsSentimentProps) {
  const [showAllArticles, setShowAllArticles] = useState(false)
  const articlesToShow = showAllArticles ? data.articles : data.articles.slice(0, 6)

  const getSentimentIcon = () => {
    switch (data.overallSentiment) {
      case "Positive":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "Negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentColor = () => {
    switch (data.overallSentiment) {
      case "Positive":
        return "text-green-600 bg-green-50"
      case "Negative":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Newspaper className="h-5 w-5 mr-2 text-purple-600" />
          News Sentiment
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getSentimentColor()}`}>
          {getSentimentIcon()}
          <span className="ml-1">{data.overallSentiment}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Articles Analyzed</span>
          <span className="text-2xl font-bold text-gray-900">{data.totalArticles}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sentiment Score</span>
          <span className="text-lg font-semibold text-gray-900">{data.avgSentiment}</span>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Positive: {data.counts.positive}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Negative: {data.counts.negative}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-gray-600">Neutral: {data.counts.neutral}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Articles</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articlesToShow.map((article, index) => (
            <ArticleCard key={index} article={article} />
          ))}
        </div>

        {data.articles.length > 6 && (
          <div className="text-center mt-4">
            <button 
              onClick={() => setShowAllArticles(!showAllArticles)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {showAllArticles ? 'Show Less' : `Show All ${data.articles.length} Articles`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}