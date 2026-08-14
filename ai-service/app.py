from flask import Flask, jsonify, request
from flask_cors import CORS
from services.demand_forecast import demand_forecast
from services.reorder_engine import reorder_engine
from services.anomaly_detection import anomaly_detection
from services.stock_health import stock_health

app = Flask(__name__)
CORS(app)

@app.route('/api/ai/forecast/<int:product_id>', methods=['GET'])
def get_forecast(product_id):
    try:
        result = demand_forecast(product_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/reorder-suggestions', methods=['GET'])
def get_reorder_suggestions():
    try:
        result = reorder_engine()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/anomalies', methods=['GET'])
def get_anomalies():
    try:
        result = anomaly_detection()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/stock-health', methods=['GET'])
def get_stock_health():
    try:
        result = stock_health()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/query', methods=['POST'])
def natural_language_query():
    try:
        data = request.get_json()
        query = data.get('query', '')
        result = handle_natural_language_query(query)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_natural_language_query(query):
    query_lower = query.lower()
    
    if 'forecast' in query_lower or 'predict' in query_lower:
        return {'type': 'forecast', 'message': 'Use /api/ai/forecast/<product_id> for specific product forecasts'}
    elif 'reorder' in query_lower:
        suggestions = reorder_engine()
        return {'type': 'reorder', 'data': suggestions}
    elif 'anomal' in query_lower or 'unusual' in query_lower:
        anomalies = anomaly_detection()
        return {'type': 'anomalies', 'data': anomalies}
    elif 'health' in query_lower or 'status' in query_lower:
        health = stock_health()
        return {'type': 'stock_health', 'data': health}
    else:
        return {'type': 'general', 'message': 'I can help with forecasts, reorder suggestions, anomaly detection, and stock health analysis.'}

if __name__ == '__main__':
    app.run(debug=False, port=5000)
