import os
os.environ["TRANSFORMERS_NO_TF"] = "1"

from flask import Flask, request, jsonify, abort
from transformers import pipeline
import logging

app = Flask(__name__)

# Initialize FinBERT pipeline
print("Loading FinBERT model...")
sentiment_pipeline = pipeline("sentiment-analysis", 
                            model="ProsusAI/finbert",
                            return_all_scores=True)
print("FinBERT model loaded successfully!")

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.json
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({'error': 'No texts provided'}), 400
        
        results = []
        for text in texts:
            # Analyze with FinBERT
            scores = sentiment_pipeline(text[:512])  # Limit text length
            
            # FinBERT returns: positive, negative, neutral
            sentiment_scores = {item['label']: item['score'] for item in scores[0]}
            
            # Determine primary sentiment
            primary_sentiment = max(sentiment_scores, key=sentiment_scores.get)
            confidence = sentiment_scores[primary_sentiment]
            
            results.append({
                'text': text[:100] + '...' if len(text) > 100 else text,
                'sentiment': primary_sentiment,
                'confidence': round(confidence, 3),
                'scores': {
                    'positive': round(sentiment_scores.get('positive', 0), 3),
                    'negative': round(sentiment_scores.get('negative', 0), 3),
                    'neutral': round(sentiment_scores.get('neutral', 0), 3)
                }
            })
        
        return jsonify({'results': results})
        
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'FinBERT'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)