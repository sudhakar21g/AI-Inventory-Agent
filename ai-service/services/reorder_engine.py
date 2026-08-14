import pandas as pd
import numpy as np
import os

def reorder_engine():
    products = load_products()
    sales_data = load_sales_data()
    inventory_movements = load_inventory_movements()
    
    suggestions = []
    
    for _, product in products.iterrows():
        product_id = product['id']
        current_stock = calculate_current_stock(product_id, inventory_movements)
        sales_velocity = calculate_sales_velocity(product_id, sales_data)
        reorder_level = product['reorder_level']
        
        if current_stock <= reorder_level:
            suggested_qty = calculate_reorder_quantity(
                current_stock, sales_velocity, reorder_level
            )
            
            days_until_stockout = calculate_days_until_stockout(
                current_stock, sales_velocity
            )
            
            suggestions.append({
                'product_id': int(product_id),
                'product_name': product['name'],
                'sku': product['sku'],
                'category': product['category'],
                'current_stock': current_stock,
                'reorder_level': reorder_level,
                'sales_velocity': round(sales_velocity, 2),
                'suggested_quantity': suggested_qty,
                'days_until_stockout': days_until_stockout,
                'urgency': get_urgency(days_until_stockout),
                'estimated_cost': round(suggested_qty * product['cost_price'], 2)
            })
    
    suggestions.sort(key=lambda x: x['days_until_stockout'])
    
    return {
        'suggestions': suggestions,
        'total_items': len(suggestions),
        'critical_items': len([s for s in suggestions if s['urgency'] == 'critical']),
        'warning_items': len([s for s in suggestions if s['urgency'] == 'warning'])
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
        'cost_price': [15.00, 25.00, 40.00, 18.00, 30.00, 6.00, 10.00, 4.00, 7.00, 12.00,
                       150.00, 225.00, 8.00, 12.00, 6.00],
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

def calculate_reorder_quantity(current_stock, sales_velocity, reorder_level):
    safety_stock = reorder_level * 0.5
    lead_time = 7
    reorder_qty = int((sales_velocity * lead_time) + safety_stock - current_stock)
    return max(0, reorder_qty)

def calculate_days_until_stockout(current_stock, sales_velocity):
    if sales_velocity <= 0:
        return 999
    return int(current_stock / sales_velocity)

def get_urgency(days_until_stockout):
    if days_until_stockout <= 3:
        return 'critical'
    elif days_until_stockout <= 7:
        return 'warning'
    else:
        return 'normal'
