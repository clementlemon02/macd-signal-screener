import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SignalDisplayConfig, SignalType, TimeFrame } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings } from 'lucide-react';

interface SettingsDialogProps {
  selectedTimeframes: TimeFrame[];
  macdDays: number;
  priceChartDays: number;
  enabledSignals: SignalDisplayConfig[];
  onTimeframesChange: (value: TimeFrame[]) => void;
  onMacdDaysChange: (value: number) => void;
  onPriceChartDaysChange: (value: number) => void;
  onSignalConfigChange: (value: SignalDisplayConfig[]) => void;
}

const timeframes: TimeFrame[] = ['1d', '2d', '3d', '5d', '1wk', '2wk', '3wk', '1mo', '2mo', '3mo', '4mo', '5mo'];
const macdDayOptions = [3, 5, 7, 10, 14, 21, 30];
const priceChartDayOptions = [7, 14, 30, 60, 90, 180];
const macdChartDayOptions = [7, 14, 30, 60];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  selectedTimeframes,
  macdDays,
  priceChartDays,
  enabledSignals,
  onTimeframesChange,
  onMacdDaysChange,
  onPriceChartDaysChange,
  onSignalConfigChange,
}) => {
  const handleTimeframeToggle = (timeframe: TimeFrame) => {
    if (selectedTimeframes.includes(timeframe)) {
      onTimeframesChange(selectedTimeframes.filter(tf => tf !== timeframe));
    } else {
      onTimeframesChange([...selectedTimeframes, timeframe]);
    }
  };

  const handleSignalToggle = (signalType: SignalType) => {
    const newSignals = enabledSignals.map(signal => 
      signal.type === signalType 
        ? { ...signal, enabled: !signal.enabled }
        : signal
    );
    onSignalConfigChange(newSignals);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chart Settings</DialogTitle>
          <DialogDescription>
            Customize the display of timeframes, signals, and charts
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="timeframes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeframes">Timeframes</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="chart">Charts</TabsTrigger>
          </TabsList>
          <div className="h-[400px] mt-4 relative overflow-hidden">
            <TabsContent value="timeframes" className="absolute inset-0 p-4">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-4 gap-4">
                  {timeframes.map((tf) => (
                    <div key={tf} className="flex items-center space-x-2">
                      <Checkbox
                        id={`timeframe-${tf}`}
                        checked={selectedTimeframes.includes(tf)}
                        onCheckedChange={() => handleTimeframeToggle(tf)}
                      />
                      <Label htmlFor={`timeframe-${tf}`} className="text-sm">
                        {tf}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="signals" className="absolute inset-0 p-4">
              <ScrollArea className="h-full pr-4">
                <div className="grid gap-4">
                  {enabledSignals.map((signal) => (
                    <div key={signal.type} className="flex items-start space-x-3">
                      <Checkbox
                        id={`signal-${signal.type}`}
                        checked={signal.enabled}
                        onCheckedChange={() => handleSignalToggle(signal.type)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`signal-${signal.type}`} className="text-sm font-medium">
                          {signal.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {signal.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="chart" className="absolute inset-0 p-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Price Chart Range (Days)</Label>
                    <Select
                      value={priceChartDays.toString()}
                      onValueChange={(value) => onPriceChartDaysChange(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceChartDayOptions.map((days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} days
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>MACD Chart Range (Days)</Label>
                    <Select
                      value={macdDays.toString()}
                      onValueChange={(value) => onMacdDaysChange(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        {macdChartDayOptions.map((days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} days
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};