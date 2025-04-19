import React from 'react';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

const TimeControl: React.FC = () => {
  const { phase, speed, setSpeed, pause, resume } = useGame();
  const { playSuccess } = useAudio();
  
  const handlePlayPause = () => {
    if (phase === 'playing') {
      pause();
    } else {
      resume();
    }
    playSuccess();
  };
  
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    playSuccess();
  };
  
  return (
    <div className="flex items-center space-x-2 ml-4">
      {/* Play/Pause Button */}
      <button 
        className="text-white hover:text-gray-300 transition-colors"
        onClick={handlePlayPause}
        title={phase === 'playing' ? 'Pause' : 'Play'}
      >
        {phase === 'playing' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        )}
      </button>
      
      {/* Speed Controls */}
      <div className="flex rounded overflow-hidden">
        <button 
          className={`px-2 py-1 text-xs ${speed === 1 ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => handleSpeedChange(1)}
          title="Normal Speed"
        >
          1x
        </button>
        <button 
          className={`px-2 py-1 text-xs ${speed === 2 ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => handleSpeedChange(2)}
          title="Fast Speed"
        >
          2x
        </button>
        <button 
          className={`px-2 py-1 text-xs ${speed === 3 ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => handleSpeedChange(3)}
          title="Very Fast Speed"
        >
          3x
        </button>
      </div>
    </div>
  );
};

export default TimeControl;
