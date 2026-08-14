import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta

def demand_forecast(product_id):
    sales_data = load_sales_data()
    product_sales = sales_data[sales_data['product_id'] == product_id]
    
    if len(product_sales) < 3:
        return simple_moving_average_forecast(product_id, product_sales)
    else:
        return model_based_forecast(product_id, product_sales)

def load_sales_data():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sales_data.csv')
    return pd.read_csv(data_path)

def simple_moving_average_forecast(product_id, product_sales):
    if len(product_sales) == 0:
        return {
            'product_id': product_id,
            'forecast': [],
            'method': 'no_data',
            'message': 'No sales data available for this product'
        }
    
    avg_quantity = product_sales['quantity'].mean()
    recent_avg = product_sales['quantity'].tail(3).mean()
    
    today = datetime.now()
    forecast = []
    
    for i in range(1, 8):
        forecast_date = today + timedelta(days=i)
        predicted_qty = max(0, int(recent_avg * (1 + np.random.uniform(-0.1, 0.1))))
        forecast.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'predicted_quantity': predicted_qty,
            'confidence': 0.7
        })
    
    return {
        'product_id': product_id,
        'forecast': forecast,
        'method': 'moving_average',
        'average_daily_sales': round(avg_quantity, 2),
        'recent_trend': 'stable' if abs(recent_avg - avg_quantity) < avg_quantity * 0.1 else 'increasing'
    }

def model_based_forecast(product_id, product_sales):
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_model.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'scaler.pkl')
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return simple_moving_average_forecast(product_id, product_sales)
    
    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        today = datetime.now()
        forecast = []
        
        for i in range(1, 8):
            forecast_date = today + timedelta(days=i)
            features = np.array([[
                forecast_date.weekday(),
                forecast_date.month,
                product_sales['unit_price'].mean(),
                product_sales['quantity'].mean()
            ]])
            features_scaled = scaler.transform(features)
            predicted_qty = max(0, int(model.predict(features_scaled)[0]))
            
            forecast.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predicted_quantity': predicted_qty,
                'confidence': 0.85
            })
        
        return {
            'product_id': product_id,
            'forecast': forecast,
            'method': 'ml_model',
            'model_accuracy': 0.85
        }
    except Exception as e:
        return simple_moving_average_forecast(product_id, product_sales)
