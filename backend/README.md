# MACD Signal Screener Backend

This is the backend for the MACD Signal Screener application. It provides API endpoints for fetching stock data from Polygon.io and calculating MACD signals.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the root directory with your Polygon.io API key:
```
POLYGON_API_KEY=your_polygon_api_key_here
```

## Running the Server

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with automatic API documentation at `http://localhost:8000/docs`.

## Testing

### Testing Polygon.io API Integration

Run the following command to test the Polygon.io API integration:
```bash
python test_polygon_api.py
```

This will test:
- API key validation
- Fetching stock data
- Fetching ticker details
- Fetching stocks list

### Testing MACD Service

Run the following command to test the MACD service:
```bash
python test_macd_service.py
```

This will test:
- MACD calculation
- Signal generation

### Testing API Endpoints

First, start the FastAPI server, then run:
```bash
python test_api_endpoints.py
```

This will test:
- Root endpoint
- Stocks endpoint
- Specific stock endpoint

## API Endpoints

- `GET /`: Welcome message
- `GET /api/v1/stocks`: Get list of stocks with MACD signals
- `GET /api/v1/stocks/{symbol}`: Get detailed data for a specific stock

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/
│   │       └── stocks.py
│   ├── core/
│   │   └── config.py
│   ├── services/
│   │   ├── polygon_service.py
│   │   └── macd_service.py
│   ├── __init__.py
│   └── main.py
├── requirements.txt
└── .env
``` 