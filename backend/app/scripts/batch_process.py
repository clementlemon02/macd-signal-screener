import asyncio
from datetime import datetime
import json
from app.services.batch_signal_processor import batch_signal_processor
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
            signals = await batch_signal_processor.process_symbols(batch, '1day')
            signals_by_symbol = {}
            for signal in signals:
                symbol = signal['symbol']
                if symbol not in signals_by_symbol:
                    signals_by_symbol[symbol] = []
                signals_by_symbol[symbol].append(signal)
            
            for symbol in batch:
                signal_count = len(signals_by_symbol.get(symbol, []))
                print(f"Generated {signal_count} signals for {symbol}")
        except Exception as e:
            print(f"Error processing batch {batch}: {str(e)}")

async def main():
    print(f"Starting signal processing at {datetime.now()}")
    
    await process_signals()
    
    print(f"Signal processing completed at {datetime.now()}")

if __name__ == "__main__":
    asyncio.run(main()) 