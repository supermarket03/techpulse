// components/article-card.tsx
interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const confidenceWidth = Math.round(article.confidence * 100)

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
          {article.sentiment.toUpperCase()}
        </span>
        <div className="text-xs text-gray-500">
          Confidence: {Math.round(article.confidence * 100)}%
        </div>
      </div>
      
      <h4 className="font-medium text-sm mb-2 line-clamp-2">
        <a href={article.link} target="_blank" rel="noopener noreferrer" 
           className="hover:text-blue-600 transition-colors">
          {article.title}
        </a>
      </h4>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{article.source}</span>
        <span>{new Date(article.published).toLocaleDateString()}</span>
      </div>
      
      <div className="mt-2 bg-gray-200 rounded-full h-1">
        <div 
          className="bg-blue-500 h-1 rounded-full" 
          style={{ width: `${confidenceWidth}%` }}
        />
      </div>
    </div>
  )
}