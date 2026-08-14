import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def anomaly_detection():
    sales_data = load_sales_data()
    anomalies = []
    
    anomalies.extend(detect_sales_anomalies(sales_data))
    anomalies.extend(detect_price_anomalies(sales_data))
    anomalies.extend(detect_velocity_anomalies(sales_data))
    
    return {
        'anomalies': anomalies,
        'total_detected': len(anomalies),
        'severity_counts': {
            'high': len([a for a in anomalies if a['severity'] == 'high']),
            'medium': len([a for a in anomalies if a['severity'] == 'medium']),
            'low': len([a for a in anomalies if a['severity'] == 'low'])
        }
    }

def load_sales_data():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sales_data.csv')
    return pd.read_csv(data_path)

def detect_sales_anomalies(sales_data):
    anomalies = []
    
    if len(sales_data) < 5:
        return anomalies
    
    for product_id in sales_data['product_id'].unique():
        product_sales = sales_data[sales_data['product_id'] == product_id]
        quantities = product_sales['quantity']
        
        mean_qty = quantities.mean()
        std_qty = quantities.std()
        
        if std_qty == 0:
            continue
        
        for _, sale in product_sales.iterrows():
            z_score = (sale['quantity'] - mean_qty) / std_qty
            
            if abs(z_score) > 2.5:
                anomalies.append({
                    'type': 'sales_quantity',
                    'product_id': int(product_id),
                    'sale_id': int(sale.get('id', 0)),
                    'value': int(sale['quantity']),
                    'expected_range': f"{max(0, int(mean_qty - 2*std_qty))} - {int(mean_qty + 2*std_qty)}",
                    'z_score': round(float(z_score), 2),
                    'severity': 'high' if abs(z_score) > 3 else 'medium',
                    'description': f"Unusual quantity {'sold' if z_score > 0 else 'returned'}: {sale['quantity']} units",
                    'detected_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
    
    return anomalies

def detect_price_anomalies(sales_data):
    anomalies = []
    
    for product_id in sales_data['product_id'].unique():
        product_sales = sales_data[sales_data['product_id'] == product_id]
        prices = product_sales['unit_price']
        
        if len(prices) < 3:
            continue
        
        mean_price = prices.mean()
        std_price = prices.std()
        
        if std_price == 0:
            continue
        
        for _, sale in product_sales.iterrows():
            z_score = (sale['unit_price'] - mean_price) / std_price
            
            if abs(z_score) > 2:
                anomalies.append({
                    'type': 'price_anomaly',
                    'product_id': int(product_id),
                    'sale_id': int(sale.get('id', 0)),
                    'value': float(sale['unit_price']),
                    'expected_range': f"${mean_price - 2*std_price:.2f} - ${mean_price + 2*std_price:.2f}",
                    'z_score': round(float(z_score), 2),
                    'severity': 'high' if abs(z_score) > 3 else 'medium',
                    'description': f"Unusual price: ${sale['unit_price']:.2f} (avg: ${mean_price:.2f})",
                    'detected_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
    
    return anomalies

def detect_velocity_anomalies(sales_data):
    anomalies = []
    sales_data['sale_date'] = pd.to_datetime(sales_data['sale_date'])
    
    for product_id in sales_data['product_id'].unique():
        product_sales = sales_data[sales_data['product_id'] == product_id].copy()
        product_sales = product_sales.sort_values('sale_date')
        
        if len(product_sales) < 3:
            continue
        
        daily_sales = product_sales.groupby(product_sales['sale_date'].dt.date)['quantity'].sum()
        
        if len(daily_sales) < 3:
            continue
        
        mean_daily = daily_sales.mean()
        std_daily = daily_sales.std()
        
        if std_daily == 0:
            continue
        
        for date, qty in daily_sales.items():
            z_score = (qty - mean_daily) / std_daily
            
            if abs(z_score) > 2:
                anomalies.append({
                    'type': 'velocity_anomaly',
                    'product_id': int(product_id),
                    'date': str(date),
                    'value': int(qty),
                    'expected_range': f"{max(0, int(mean_daily - 2*std_daily))} - {int(mean_daily + 2*std_daily)}",
                    'z_score': round(float(z_score), 2),
                    'severity': 'high' if abs(z_score) > 3 else 'low',
                    'description': f"Unusual daily sales velocity: {qty} units on {date}",
                    'detected_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
    
    return anomalies
