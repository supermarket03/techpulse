"use client"

import { MessageSquare, ThumbsUp } from "lucide-react"

interface BuzzData {
  keyword: string
  buzzCount: number
  upvotesTotal: number
  timestamp: string
}

interface BuzzMetricsProps {
  data: BuzzData
}

export default function BuzzMetrics({ data }: BuzzMetricsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
          Reddit Buzz
        </h3>
        <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">7 Days</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Total Posts</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{typeof data.buzzCount === 'number' ? data.buzzCount.toLocaleString() : '0'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Total Upvotes</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{typeof data.upvotesTotal === 'number' ? data.upvotesTotal.toLocaleString() : '0'}</span>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg. Upvotes/Post</span>
            <span className="text-lg font-semibold text-blue-600">
              {data.buzzCount > 0 ? Math.round(data.upvotesTotal / data.buzzCount) : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}