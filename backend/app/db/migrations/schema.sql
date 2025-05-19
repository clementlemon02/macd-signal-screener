CREATE TABLE macd_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    symbol TEXT NOT NULL,                     -- E.g., AAPL, BTC/USD
    asset_type TEXT NOT NULL,                 -- 'stock' or 'crypto'
    timeframe TEXT NOT NULL,                  -- '1D', '2D', '1W', etc.
    date DATE NOT NULL,                       -- Date of the MACD signal
    close_price NUMERIC,                      -- Closing price
    macd_line NUMERIC,                        -- MACD line value
    signal_line NUMERIC,                      -- Signal line value
    macd_histogram NUMERIC,                   -- MACD - Signal
    ema_mid NUMERIC,                          -- Optional EMA midpoint

    signal_1 BOOLEAN DEFAULT FALSE,
    signal_2 BOOLEAN DEFAULT FALSE,
    signal_3 BOOLEAN DEFAULT FALSE,
    signal_4 BOOLEAN DEFAULT FALSE,
    signal_5 BOOLEAN DEFAULT FALSE,
    signal_6 BOOLEAN DEFAULT FALSE,
    signal_7 BOOLEAN DEFAULT FALSE,

    meta_cycle_id INTEGER,                    -- ID to track MACD signal cycle
    meta_condition TEXT, 
    true_signal_count NUMERIC,                     -- Description of last signal triggered

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_symbol_date_timeframe ON macd_signals(symbol, date, timeframe);
