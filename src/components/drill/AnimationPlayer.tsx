import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DrillDiagram } from './DrillDiagram';
import { DrillJsonData, AnimationKeyframe, Position } from '@/types/drill';

interface AnimationPlayerProps {
  drillJson: DrillJsonData;
  className?: string;
}

// Easing functions
const applyEasing = (t: number, easing: string): number => {
  switch (easing) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:
      return t; // linear
  }
};

export function AnimationPlayer({ drillJson, className }: AnimationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 1 within current segment
  const [speed, setSpeed] = useState(1);
  const [looping, setLooping] = useState(true);
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startProgressRef = useRef<number>(0);
  
  const keyframes = drillJson.animation?.keyframes || [];
  const totalDuration = drillJson.animation?.duration || 0;
  
  // Calculate current positions by interpolating between keyframes
  const getCurrentPositions = useCallback((): { [entityId: string]: Position } => {
    if (keyframes.length === 0) return {};
    if (keyframes.length === 1) return keyframes[0].positions;
    if (currentKeyframeIndex >= keyframes.length - 1) {
      return keyframes[keyframes.length - 1].positions;
    }
    
    const fromKf = keyframes[currentKeyframeIndex];
    const toKf = keyframes[currentKeyframeIndex + 1];
    const eased = applyEasing(progress, toKf.easing);
    
    const positions: { [entityId: string]: Position } = {};
    
    // Get all entity IDs from both keyframes
    const allEntityIds = new Set([
      ...Object.keys(fromKf.positions),
      ...Object.keys(toKf.positions)
    ]);
    
    for (const entityId of allEntityIds) {
      const fromPos = fromKf.positions[entityId];
      const toPos = toKf.positions[entityId];
      
      if (fromPos && toPos) {
        positions[entityId] = {
          x: fromPos.x + (toPos.x - fromPos.x) * eased,
          y: fromPos.y + (toPos.y - fromPos.y) * eased
        };
      } else if (toPos) {
        positions[entityId] = toPos;
      } else if (fromPos) {
        positions[entityId] = fromPos;
      }
    }
    
    return positions;
  }, [keyframes, currentKeyframeIndex, progress]);
  
  // Calculate overall progress (0-100)
  const calculateOverallProgress = useCallback((): number => {
    if (keyframes.length <= 1) return 0;
    
    let elapsed = 0;
    for (let i = 0; i < currentKeyframeIndex; i++) {
      elapsed += keyframes[i + 1]?.duration || 0;
    }
    
    if (currentKeyframeIndex < keyframes.length - 1) {
      const currentSegmentDuration = keyframes[currentKeyframeIndex + 1]?.duration || 1;
      elapsed += currentSegmentDuration * progress;
    }
    
    return totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  }, [keyframes, currentKeyframeIndex, progress, totalDuration]);
  
  // Seek to a specific overall progress (0-1)
  const seekToProgress = useCallback((targetProgress: number) => {
    if (keyframes.length <= 1) return;
    
    const targetTime = targetProgress * totalDuration;
    let elapsed = 0;
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const segmentDuration = keyframes[i + 1].duration;
      if (elapsed + segmentDuration >= targetTime) {
        setCurrentKeyframeIndex(i);
        setProgress((targetTime - elapsed) / segmentDuration);
        return;
      }
      elapsed += segmentDuration;
    }
    
    // At the end
    setCurrentKeyframeIndex(keyframes.length - 1);
    setProgress(1);
  }, [keyframes, totalDuration]);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying || keyframes.length < 2) return;
    
    const nextKf = keyframes[currentKeyframeIndex + 1];
    if (!nextKf) {
      if (looping) {
        setCurrentKeyframeIndex(0);
        setProgress(0);
      } else {
        setIsPlaying(false);
      }
      return;
    }
    
    const duration = nextKf.duration / speed;
    startTimeRef.current = Date.now();
    startProgressRef.current = progress;
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = startProgressRef.current + (elapsed / duration) * (1 - startProgressRef.current);
      
      if (newProgress >= 1) {
        if (currentKeyframeIndex + 1 >= keyframes.length - 1) {
          if (looping) {
            setCurrentKeyframeIndex(0);
            setProgress(0);
          } else {
            setProgress(1);
            setIsPlaying(false);
          }
        } else {
          setCurrentKeyframeIndex(prev => prev + 1);
          setProgress(0);
        }
      } else {
        setProgress(newProgress);
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentKeyframeIndex, speed, looping, keyframes, progress]);
  
  // Stop animation when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  const handlePrevKeyframe = () => {
    setIsPlaying(false);
    setCurrentKeyframeIndex(Math.max(0, currentKeyframeIndex - 1));
    setProgress(0);
  };
  
  const handleNextKeyframe = () => {
    setIsPlaying(false);
    if (currentKeyframeIndex < keyframes.length - 1) {
      setCurrentKeyframeIndex(currentKeyframeIndex + 1);
      setProgress(0);
    }
  };
  
  const handlePlayPause = () => {
    if (!isPlaying && currentKeyframeIndex >= keyframes.length - 1 && progress >= 1) {
      // Reset to beginning if at end
      setCurrentKeyframeIndex(0);
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleKeyframeClick = (idx: number) => {
    setIsPlaying(false);
    setCurrentKeyframeIndex(idx);
    setProgress(0);
  };
  
  if (!drillJson.animation || keyframes.length === 0) {
    return <DrillDiagram drillJson={drillJson} className={className} />;
  }
  
  return (
    <div className={className}>
      {/* Animated Drill Diagram */}
      <div className="rounded-lg overflow-hidden border border-border">
        <DrillDiagram 
          drillJson={drillJson} 
          animatedPositions={getCurrentPositions()} 
        />
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-2 mt-4">
        {/* Previous Keyframe */}
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevKeyframe}
          disabled={currentKeyframeIndex === 0}
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        {/* Play/Pause */}
        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        {/* Next Keyframe */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextKeyframe}
          disabled={currentKeyframeIndex >= keyframes.length - 1}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-4">
          <Slider
            value={[calculateOverallProgress()]}
            max={100}
            step={1}
            onValueChange={(value) => seekToProgress(value[0] / 100)}
          />
        </div>
        
        {/* Speed Control */}
        <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Loop Toggle */}
        <Button
          variant={looping ? 'default' : 'outline'}
          size="icon"
          onClick={() => setLooping(!looping)}
        >
          <Repeat className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Keyframe Labels */}
      {keyframes.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {keyframes.map((kf, idx) => (
            <Button
              key={kf.id}
              variant={idx === currentKeyframeIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleKeyframeClick(idx)}
              className="shrink-0"
            >
              {kf.label || `Step ${idx + 1}`}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
