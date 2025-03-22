
import React from 'react';
import { Star } from 'lucide-react';
import { useWatchlist } from '@/context/WatchlistContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WatchlistButtonProps {
  symbol: string;
  className?: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ symbol, className }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { toast } = useToast();
  const isWatchlisted = isInWatchlist(symbol);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    
    if (isWatchlisted) {
      removeFromWatchlist(symbol);
      toast({
        title: "Removed from watchlist",
        description: `${symbol} has been removed from your watchlist`,
        duration: 2000,
      });
    } else {
      addToWatchlist(symbol);
      toast({
        title: "Added to watchlist",
        description: `${symbol} has been added to your watchlist`,
        duration: 2000,
      });
    }
  };

  return (
    <button
      onClick={handleToggleWatchlist}
      className={cn(
        "rounded-full p-1.5 transition-colors", 
        isWatchlisted 
          ? "text-amber-400 hover:text-amber-500" 
          : "text-muted-foreground hover:text-amber-400",
        className
      )}
      aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Star className={cn("h-4 w-4", isWatchlisted && "fill-current")} />
    </button>
  );
};

export default WatchlistButton;
