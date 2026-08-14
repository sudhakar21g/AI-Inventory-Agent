import pandas as pd
import numpy as np
import os
from datetime import datetime

def stock_health():
    products = load_products()
    sales_data = load_sales_data()
    inventory_movements = load_inventory_movements()
    
    health_scores = []
    
    for _, product in products.iterrows():
        product_id = product['id']
        current_stock = calculate_current_stock(product_id, inventory_movements)
        reorder_level = product['reorder_level']
        sales_velocity = calculate_sales_velocity(product_id, sales_data)
        
        score = calculate_health_score(current_stock, reorder_level, sales_velocity)
        status = get_health_status(score)
        days_of_stock = calculate_days_of_stock(current_stock, sales_velocity)
        
        health_scores.append({
            'product_id': int(product_id),
            'product_name': product['name'],
            'sku': product['sku'],
            'category': product['category'],
            'current_stock': current_stock,
            'reorder_level': reorder_level,
            'sales_velocity': round(sales_velocity, 2),
            'days_of_stock': days_of_stock,
            'health_score': score,
            'status': status,
            'recommendations': generate_recommendations(score, current_stock, reorder_level, sales_velocity)
        })
    
    overall_score = np.mean([h['health_score'] for h in health_scores]) if health_scores else 0
    
    return {
        'items': health_scores,
        'overall_health_score': round(overall_score, 2),
        'overall_status': get_health_status(overall_score),
        'summary': {
            'total_products': len(health_scores),
            'healthy': len([h for h in health_scores if h['status'] == 'healthy']),
            'warning': len([h for h in health_scores if h['status'] == 'warning']),
            'critical': len([h for h in health_scores if h['status'] == 'critical']),
            'out_of_stock': len([h for h in health_scores if h['current_stock'] <= 0])
        }
    }

def load_products():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'products.csv')
    if os.path.exists(data_path):
        return pd.read_csv(data_path)
    return create_sample_products()

def load_sales_data():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sales_data.csv')
    return pd.read_csv(data_path)

def load_inventory_movements():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'inventory_movements.csv')
    if os.path.exists(data_path):
        return pd.read_csv(data_path)
    return create_sample_movements()

def create_sample_products():
    return pd.DataFrame({
        'id': range(1, 16),
        'name': ['Wireless Mouse', 'USB-C Hub', 'Mechanical Keyboard', 'Cotton T-Shirt', 
                 'Denim Jeans', 'Granola Bars', 'Mixed Nuts', 'Copy Paper', 
                 'Ballpoint Pens', 'Desk Organizer', 'Office Chair', 'Standing Desk',
                 'Green Tea', 'Coffee Beans', 'Sparkling Water'],
        'sku': ['ELEC-001', 'ELEC-002', 'ELEC-003', 'CLOTH-001', 'CLOTH-002',
                'FOOD-001', 'FOOD-002', 'OFFICE-001', 'OFFICE-002', 'OFFICE-003',
                'FURN-001', 'FURN-002', 'BEV-001', 'BEV-002', 'BEV-003'],
        'category': ['Electronics', 'Electronics', 'Electronics', 'Clothing', 'Clothing',
                     'Food', 'Food', 'Office Supplies', 'Office Supplies', 'Office Supplies',
                     'Furniture', 'Furniture', 'Beverages', 'Beverages', 'Beverages'],
        'reorder_level': [20, 15, 10, 25, 15, 50, 30, 100, 40, 20, 5, 3, 60, 40, 80]
    })

def create_sample_movements():
    return pd.DataFrame({
        'product_id': [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        'movement_type': ['IN', 'OUT', 'IN', 'IN', 'IN', 'IN', 'IN', 'IN', 'IN', 'IN',
                         'IN', 'IN', 'IN', 'IN', 'IN', 'IN'],
        'quantity': [100, 5, 75, 50, 200, 100, 300, 150, 500, 100, 40, 15, 8, 200, 120, 150]
    })

def calculate_current_stock(product_id, movements):
    product_movements = movements[movements['product_id'] == product_id]
    stock = 0
    for _, movement in product_movements.iterrows():
        if movement['movement_type'] == 'IN':
            stock += movement['quantity']
        elif movement['movement_type'] == 'OUT':
            stock -= movement['quantity']
        elif movement['movement_type'] == 'ADJUST':
            stock += movement['quantity']
    return stock

def calculate_sales_velocity(product_id, sales_data):
    product_sales = sales_data[sales_data['product_id'] == product_id]
    if len(product_sales) == 0:
        return 0
    
    total_quantity = product_sales['quantity'].sum()
    date_range = pd.to_datetime(product_sales['sale_date']).max() - pd.to_datetime(product_sales['sale_date']).min()
    days = max(1, date_range.days)
    
    return total_quantity / days

def calculate_health_score(current_stock, reorder_level, sales_velocity):
    if reorder_level == 0:
        reorder_level = 1
    
    stock_ratio = current_stock / reorder_level
    
    if stock_ratio >= 2:
        stock_score = 100
    elif stock_ratio >= 1.5:
        stock_score = 80
    elif stock_ratio >= 1:
        stock_score = 60
    elif stock_ratio >= 0.5:
        stock_score = 40
    elif stock_ratio > 0:
        stock_score = 20
    else:
        stock_score = 0
    
    if sales_velocity > 0:
        days_of_stock = current_stock / sales_velocity
        if days_of_stock >= 30:
            velocity_score = 100
        elif days_of_stock >= 14:
            velocity_score = 80
        elif days_of_stock >= 7:
            velocity_score = 60
        elif days_of_stock >= 3:
            velocity_score = 40
        else:
            velocity_score = 20
    else:
        velocity_score = 50
    
    return int((stock_score * 0.6) + (velocity_score * 0.4))

def calculate_days_of_stock(current_stock, sales_velocity):
    if sales_velocity <= 0:
        return 999
    return int(current_stock / sales_velocity)

def get_health_status(score):
    if score >= 80:
        return 'healthy'
    elif score >= 50:
        return 'warning'
    else:
        return 'critical'

def generate_recommendations(score, current_stock, reorder_level, sales_velocity):
    recommendations = []
    
    if current_stock <= 0:
        recommendations.append("URGENT: Out of stock - place emergency order immediately")
    elif current_stock <= reorder_level * 0.5:
        recommendations.append("Critical: Stock critically low - expedite reorder")
    elif current_stock <= reorder_level:
        recommendations.append("Warning: Stock at reorder level - place new order")
    
    if sales_velocity > 0:
        days_of_stock = current_stock / sales_velocity
        if days_of_stock < 3:
            recommendations.append(f"Only {int(days_of_stock)} days of stock remaining at current sales rate")
        elif days_of_stock > 60:
            recommendations.append("Consider reducing stock levels to free up capital")
    
    if score < 50:
        recommendations.append("Review demand patterns and adjust reorder levels")
    
    if not recommendations:
        recommendations.append("Stock levels are healthy - no action needed")
    
    return recommendations
