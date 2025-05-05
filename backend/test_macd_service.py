import numpy as np
from app.services.macd_service import macd_service

def test_macd_service():
    """Test the MACD service calculations"""
    print("Testing MACD service calculations...")
    
    # Generate sample price data
    np.random.seed(42)  # For reproducibility
    sample_prices = np.random.normal(100, 10, 100).tolist()
    
    try:
        # Test MACD calculation
        print("\nTesting calculate_macd...")
        macd_data = macd_service.calculate_macd(sample_prices)
        
        if macd_data and all(key in macd_data for key in ["macd_line", "signal_line", "histogram"]):
            print(f"✅ Successfully calculated MACD data")
            print(f"MACD line length: {len(macd_data['macd_line'])}")
            print(f"Signal line length: {len(macd_data['signal_line'])}")
            print(f"Histogram length: {len(macd_data['histogram'])}")
            
            # Print sample values
            print("\nSample MACD values:")
            for i in range(min(5, len(macd_data['macd_line']))):
                print(f"Day {i}: MACD={macd_data['macd_line'][i]:.4f}, Signal={macd_data['signal_line'][i]:.4f}, Hist={macd_data['histogram'][i]:.4f}")
        else:
            print("❌ Failed to calculate MACD data")
        
        # Test signal calculation
        print("\nTesting calculate_signals...")
        signals = macd_service.calculate_signals(macd_data)
        
        if signals:
            print(f"✅ Successfully calculated {len(signals)} signals")
            
            # Print sample signals
            print("\nSample signals:")
            for i, signal in enumerate(signals[:5]):
                print(f"Day {i}: {signal}")
        else:
            print("❌ Failed to calculate signals")
        
        print("\n✅ All MACD service tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing MACD service: {str(e)}")

if __name__ == "__main__":
    test_macd_service() 