import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def preprocess_sales_data(df):
    df = df.copy()
    df['sale_date'] = pd.to_datetime(df['sale_date'])
    df['day_of_week'] = df['sale_date'].dt.dayofweek
    df['month'] = df['sale_date'].dt.month
    df['day_of_month'] = df['sale_date'].dt.day
    df['week_of_year'] = df['sale_date'].dt.isocalendar().week.astype(int)
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    return df

def preprocess_inventory_movements(df):
    df = df.copy()
    df['movement_date'] = pd.to_datetime(df['movement_date'])
    df['day_of_week'] = df['movement_date'].dt.dayofweek
    df['month'] = df['movement_date'].dt.month
    df['quantity_abs'] = df['quantity'].abs()
    return df

def create_features_for_forecast(df, product_id):
    product_df = df[df['product_id'] == product_id].copy()
    
    if len(product_df) == 0:
        return pd.DataFrame()
    
    product_df = product_df.sort_values('sale_date')
    
    product_df['rolling_mean_3'] = product_df['quantity'].rolling(window=3, min_periods=1).mean()
    product_df['rolling_mean_7'] = product_df['quantity'].rolling(window=7, min_periods=1).mean()
    product_df['rolling_std_3'] = product_df['quantity'].rolling(window=3, min_periods=1).std().fillna(0)
    
    product_df['quantity_lag_1'] = product_df['quantity'].shift(1).fillna(0)
    product_df['quantity_lag_2'] = product_df['quantity'].shift(2).fillna(0)
    
    product_df['price_change'] = product_df['unit_price'].pct_change().fillna(0)
    
    return product_df

def normalize_data(df, columns):
    df = df.copy()
    for col in columns:
        if col in df.columns:
            min_val = df[col].min()
            max_val = df[col].max()
            if max_val > min_val:
                df[f'{col}_normalized'] = (df[col] - min_val) / (max_val - min_val)
            else:
                df[f'{col}_normalized'] = 0
    return df

def handle_missing_values(df, strategy='mean'):
    df = df.copy()
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numeric_cols:
        if df[col].isnull().sum() > 0:
            if strategy == 'mean':
                df[col].fillna(df[col].mean(), inplace=True)
            elif strategy == 'median':
                df[col].fillna(df[col].median(), inplace=True)
            elif strategy == 'zero':
                df[col].fillna(0, inplace=True)
    
    return df

def detect_outliers(df, column, method='zscore', threshold=3):
    if method == 'zscore':
        mean = df[column].mean()
        std = df[column].std()
        z_scores = np.abs((df[column] - mean) / std)
        return df[z_scores <= threshold]
    elif method == 'iqr':
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        return df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    return df

def aggregate_sales_by_period(df, period='daily'):
    df = df.copy()
    df['sale_date'] = pd.to_datetime(df['sale_date'])
    
    if period == 'daily':
        aggregated = df.groupby(df['sale_date'].dt.date).agg({
            'quantity': 'sum',
            'total_price': 'sum',
            'unit_price': 'mean'
        }).reset_index()
    elif period == 'weekly':
        aggregated = df.groupby(df['sale_date'].dt.isocalendar().week).agg({
            'quantity': 'sum',
            'total_price': 'sum',
            'unit_price': 'mean'
        }).reset_index()
    elif period == 'monthly':
        aggregated = df.groupby(df['sale_date'].dt.month).agg({
            'quantity': 'sum',
            'total_price': 'sum',
            'unit_price': 'mean'
        }).reset_index()
    else:
        aggregated = df
    
    return aggregated

def calculate_statistics(df, column):
    stats = {
        'mean': df[column].mean(),
        'median': df[column].median(),
        'std': df[column].std(),
        'min': df[column].min(),
        'max': df[column].max(),
        'q25': df[column].quantile(0.25),
        'q75': df[column].quantile(0.75),
        'skewness': df[column].skew(),
        'kurtosis': df[column].kurtosis()
    }
    return stats
