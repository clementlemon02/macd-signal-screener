import asyncio
from datetime import datetime
import json
from app.services.signal_processor import signal_processor

with open("symbols.json", "r") as f:
    data = json.load(f)
    symbols = data["crypto"]

async def process_signals():
    batch_size = 8  
    print(f"Processing {len(symbols)} symbols...")

    for i in range(0, len(symbols), batch_size):
        batch = symbols[i:i+batch_size]
        print(f"Processing batch: {batch}")

        try:
            signals = await signal_processor.process_symbols(batch, '1day')
            # Group signals by symbol
            signals_by_symbol = {}
            for signal in signals:
                symbol = signal['symbol']
                if symbol not in signals_by_symbol:
                    signals_by_symbol[symbol] = []
                signals_by_symbol[symbol].append(signal)
            
            # Print results
            for symbol in batch:
                signal_count = len(signals_by_symbol.get(symbol, []))
                print(f"Generated {signal_count} signals for {symbol}")
        except Exception as e:
            print(f"Error processing batch {batch}: {str(e)}")

        await asyncio.sleep(60)  


async def main():
    print(f"Starting signal processing at {datetime.now()}")
    
    await process_signals()
    
    print(f"Signal processing completed at {datetime.now()}")

if __name__ == "__main__":
    asyncio.run(main()) 