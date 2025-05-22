import asyncio
import json
import logging
import sys
from datetime import datetime, timedelta

import pytz
from app.services.batch_signal_processor import batch_signal_processor

# Set up logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Timezone for scheduling
TIMEZONE = pytz.timezone('UTC')

# Load symbols and asset types
with open("symbols_yf.json", "r") as f:
    data = json.load(f)

symbols = []
asset_types = {}
for category, symbol_list in data.items():
    for symbol in symbol_list:
        symbols.append(symbol)
        asset_types[symbol] = category

# Schedule configurations
UPDATE_SCHEDULES = {
    '1d': {'interval': '1d', 'period': '6mo', 'schedule': 'daily'},
    '2d': {'interval': '2d', 'period': '6mo', 'schedule': 'daily'},
    '3d': {'interval': '3d', 'period': '6mo', 'schedule': 'daily'},
    '5d': {'interval': '5d', 'period': '6mo', 'schedule': 'daily'},
    '1wk': {'interval': '1wk', 'period': '6mo', 'schedule': 'weekly'},
    '2wk': {'interval': '2wk', 'period': '6mo', 'schedule': 'weekly'},
    '3wk': {'interval': '3wk', 'period': '6mo', 'schedule': 'weekly'},
    '1mo': {'interval': '1mo', 'period': '6mo', 'schedule': 'monthly'},
    '2mo': {'interval': '2mo', 'period': '6mo', 'schedule': 'monthly'},
    '3mo': {'interval': '3mo', 'period': '6mo', 'schedule': 'monthly'},
    '4mo': {'interval': '4mo', 'period': '6mo', 'schedule': 'monthly'},
    '5mo': {'interval': '5mo', 'period': '6mo', 'schedule': 'monthly'},
}

def is_last_day_of_month(today):
    """Return True if today is the last day of the month."""
    return (today + timedelta(days=1)).month != today.month

def should_run_today(config, today):
    """Check if the config should run today based on schedule type."""
    schedule_type = config['schedule']
    if schedule_type == 'daily':
        return True
    elif schedule_type == 'weekly':
        return today.weekday() == 4  # Friday
    elif schedule_type == 'monthly':
        return is_last_day_of_month(today)
    return False

async def process_interval(interval_config):
    """Run signal processing for the given interval."""
    logger.info(f"Processing interval: {interval_config['interval']}")
    try:
        signals = await batch_signal_processor.process_symbols(
            symbols=symbols,
            period=interval_config['period'],
            interval=interval_config['interval'],
            asset_types=asset_types
        )

        signals_by_symbol = {}
        for signal in signals:
            symbol = signal['symbol']
            signals_by_symbol.setdefault(symbol, []).append(signal)

        for symbol in symbols:
            signal_count = len(signals_by_symbol.get(symbol, []))
            logger.info(f"[{interval_config['interval']}] {symbol}: {signal_count} signals")

    except Exception as e:
        logger.error(f"Error processing interval {interval_config['interval']}: {e}")

def main():
    current_time = datetime.now(TIMEZONE)
    logger.info("Starting scheduled signal processing")

    for config in UPDATE_SCHEDULES.values():
        if should_run_today(config, current_time):
            asyncio.run(process_interval(config))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception(f"Unhandled exception in script: {e}")
