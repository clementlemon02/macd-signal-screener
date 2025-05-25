import json
from collections import Counter
with open('symbols_yf.json', 'r') as f:
    data = json.load(f)

# Flatten all symbol lists
all_symbols = [symbol for symbols_list in data.values() for symbol in symbols_list]

total_symbols = len(all_symbols)
unique_symbols_count = len(set(all_symbols))

print(f"Total symbols: {total_symbols}")
print(f"Unique symbols: {unique_symbols_count}")

all_symbols = [symbol for symbols_list in data.values() for symbol in symbols_list]

# Count occurrences of each symbol
symbol_counts = Counter(all_symbols)

# Filter symbols that appear more than once
duplicates = {symbol: count for symbol, count in symbol_counts.items() if count > 1}

print("Duplicate symbols and their counts:")
for symbol, count in duplicates.items():
    print(f"{symbol}: {count}")