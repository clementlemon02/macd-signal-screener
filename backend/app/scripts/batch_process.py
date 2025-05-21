import asyncio
from datetime import datetime
import json
from app.services.batch_signal_processor import batch_signal_processor

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

# Define all intervals to fetch
intervals = [
    '1d', '2d', '3d', '5d',
    '1wk', '2wk', '3wk',
    '1mo', '2mo', '3mo', '4mo', '5mo'
]

async def process_signals():
    print(f"Processing {len(symbols)} symbols across {len(intervals)} intervals...")

    try:
        for interval in intervals:
            print(f"\nFetching signals for interval: {interval}")

            # Determine appropriate period based on interval type
            if interval.endswith('d'):
                period = '1y'
            else:
                period = '3y'

            signals = await batch_signal_processor.process_symbols(
                symbols,
                period=period,
                interval=interval,
                asset_types=asset_types
            )

            # Organize the signals by symbol
            signals_by_symbol = {}
            for signal in signals:
                symbol = signal['symbol']
                if symbol not in signals_by_symbol:
                    signals_by_symbol[symbol] = []
                signals_by_symbol[symbol].append(signal)

            # Print the number of signals generated for each symbol for this interval
            for symbol in symbols:
                signal_count = len(signals_by_symbol.get(symbol, []))
                print(f"[{interval}] {symbol}: {signal_count} signals")

    except Exception as e:
        print(f"Error processing symbols: {str(e)}")


async def main():
    print(f"Starting signal processing at {datetime.now()}")
    
    await process_signals()
    
    print(f"Signal processing completed at {datetime.now()}")

if __name__ == "__main__":
    asyncio.run(main()) 
