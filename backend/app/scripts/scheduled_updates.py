import asyncio
from datetime import datetime, timedelta
import json
import pytz
from app.services.batch_signal_processor import batch_signal_processor

# Set the timezone for scheduling
TIMEZONE = pytz.timezone('UTC')

# Load the symbol data from the JSON file
with open("symbols_yf.json", "r") as f:
    data = json.load(f)

# Prepare the symbols list and asset types dictionary
symbols = []
asset_types = {}

for category, symbol_list in data.items():
    for symbol in symbol_list:
        symbols.append(symbol)
        asset_types[symbol] = category

# Define update schedules for different intervals
UPDATE_SCHEDULES = {
    '1d': {
        'interval': '1d',
        'period': '6mo',
        'schedule': 'daily',
    },
    '2d': {
        'interval': '2d',
        'period': '6mo',
        'schedule': 'daily',
    },
    '3d': {
        'interval': '3d',
        'period': '6mo',
        'schedule': 'daily',
    },
    '5d': {
        'interval': '5d',
        'period': '6mo',
        'schedule': 'daily',
    },
    '1wk': {
        'interval': '1wk',
        'period': '6mo',
        'schedule': 'weekly',
    },
    '2wk': {
        'interval': '2wk',
        'period': '6mo',
        'schedule': 'weekly',
    },
    '3wk': {
        'interval': '3wk',
        'period': '6mo',
        'schedule': 'weekly',
    },
    '1mo': {
        'interval': '1mo',
        'period': '6mo',
        'schedule': 'monthly',
    },
    '2mo': {
        'interval': '2mo',
        'period': '6mo',
        'schedule': 'monthly',
    },
    '3mo': {
        'interval': '3mo',
        'period': '6mo',
        'schedule': 'monthly',
    },
    '4mo': {
        'interval': '4mo',
        'period': '6mo',
        'schedule': 'monthly',
    },
    '5mo': {
        'interval': '5mo',
        'period': '6mo',
        'schedule': 'monthly',
    }
}

async def process_interval(interval_config):
    """Process signals for a specific interval"""
    current_time = datetime.now(TIMEZONE)
    print(f"\n[{current_time}] Processing {interval_config['interval']} interval...")

    try:
        signals = await batch_signal_processor.process_symbols(
            symbols,
            period=interval_config['period'],
            interval=interval_config['interval'],
            asset_types=asset_types
        )

        # Organize and print results
        signals_by_symbol = {}
        for signal in signals:
            symbol = signal['symbol']
            if symbol not in signals_by_symbol:
                signals_by_symbol[symbol] = []
            signals_by_symbol[symbol].append(signal)

        for symbol in symbols:
            signal_count = len(signals_by_symbol.get(symbol, []))
            print(f"[{interval_config['interval']}] {symbol}: {signal_count} signals")

    except Exception as e:
        print(f"Error processing {interval_config['interval']} interval: {str(e)}")

def is_last_day_of_month(today):
    """Return True if today is the last day of the month"""
    next_day = today + timedelta(days=1)
    return next_day.month != today.month

def should_run_today(config, today):
    """Return True if this config should run today based on schedule"""
    schedule_type = config['schedule']

    if schedule_type == 'daily':
        return True
    elif schedule_type == 'weekly':
        return today.weekday() == 4  # Friday (0=Monday, 4=Friday)
    elif schedule_type == 'monthly':
        return is_last_day_of_month(today)
    return False

def main():
    current_time = datetime.now(TIMEZONE)
    print(f"[{current_time}] Starting signal processing")

    for config in UPDATE_SCHEDULES.values():
        if should_run_today(config, current_time):
            asyncio.run(process_interval(config))

if __name__ == "__main__":
    main()
