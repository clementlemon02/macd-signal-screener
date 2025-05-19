import yfinance as yf

data = yf.download("AAPL", period="1mo", interval="1d")
print(data)