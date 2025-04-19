import React, { useState, useEffect } from 'react';
import { useAudio } from '../../lib/stores/useAudio';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useBuilding } from '../../lib/stores/useBuilding';
import { useGame } from '../../lib/stores/useGame';
import { TaskType } from '@shared/schema';
import TimeControl from './TimeControl';

const GameUI: React.FC = () => {
  const { 
    isMuted, 
    toggleMute, 
    playSuccess,
    backgroundMusic 
  } = useAudio();
  
  const { 
    dwarves = [],
    selectedDwarfId,
    selectDwarf
  } = useDwarves();
  
  const { 
    selectedBuildingType,
    selectBuildingType
  } = useBuilding();
  
  const { 
    phase = 'loading', 
    day = 1, 
    time = 0,
    speed = 1,
    weather = 'clear',
    settings = {
      showDialogues: true,
      soundVolume: 50,
      musicVolume: 50,
      debugMode: false
    },
    getCurrentTimeString = () => '00:00',
    pause = () => {},
    resume = () => {},
    setSpeed = () => {},
    updateSettings = () => {},
    overlay = 'none',
    setOverlay = () => {}
  } = useGame();
  
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  
  // Setup keyboard handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (phase === 'playing') {
          pause();
        } else if (phase === 'paused') {
          resume();
        }
      } else if (event.code === 'Escape') {
        setIsGameMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, pause, resume]);
  
  // Start background music
  useEffect(() => {
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(err => {
        console.log("Couldn't autoplay background music:", err);
      });
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic, isMuted]);
  
  // We've moved keyboard shortcut handling to the useEffect hook above
  
  // Get selected dwarf details
  const selectedDwarf = dwarves.find(d => d.id === selectedDwarfId);
  
  // Toggle sound
  const handleToggleSound = () => {
    toggleMute();
    playSuccess();
  };
  
  // We've removed user-controlled building functionality
  
  // Toggle game menu
  const handleToggleGameMenu = () => {
    setIsGameMenuOpen(prev => !prev);
    playSuccess();
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar - Time and Weather */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-lg flex items-center space-x-4 pointer-events-auto">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="font-medium">Day {day} - {getCurrentTimeString()}</span>
        </div>
        
        <div className="h-6 border-l border-gray-600"></div>
        
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {weather === "clear" && (
              <circle cx="12" cy="12" r="5" />
            )}
            {weather === "rainy" && (
              <path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
            )}
            {weather === "foggy" && (
              <>
                <path d="M5 5h14"></path>
                <path d="M5 9h14"></path>
                <path d="M5 13h14"></path>
                <path d="M5 17h14"></path>
              </>
            )}
            {weather === "stormy" && (
              <>
                <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
                <path d="m13 12-3 5h4l-2 4"></path>
              </>
            )}
          </svg>
          <span className="capitalize">{weather}</span>
        </div>
        
        <TimeControl />
      </div>
      
      {/* Bottom Left - Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col space-y-2 pointer-events-auto">
        {/* Sound Button */}
        <button 
          className="flex items-center space-x-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={handleToggleSound}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMuted ? (
              <>
                <line x1="3" y1="3" x2="21" y2="21"></line>
                <path d="M18.4 18.4A9.9 9.9 0 0 1 12 20a10 10 0 1 1 9.9-11.8"></path>
              </>
            ) : (
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            )}
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
          <span className="font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        
        {/* Menu Button */}
        <button 
          className={`flex items-center space-x-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${isGameMenuOpen ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={handleToggleGameMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
          <span className="font-medium">Settings</span>
        </button>
      </div>
      
      {/* Game Menu */}
      {isGameMenuOpen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 text-white p-6 rounded-lg shadow-lg pointer-events-auto w-96 max-w-full">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Game Settings</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Show Dwarf Dialogues</label>
              <div className="flex items-center">
                <button 
                  className={`px-3 py-1 rounded-l ${settings.showDialogues ? 'bg-blue-600' : 'bg-gray-700'}`}
                  onClick={() => updateSettings({ showDialogues: true })}
                >
                  On
                </button>
                <button 
                  className={`px-3 py-1 rounded-r ${!settings.showDialogues ? 'bg-blue-600' : 'bg-gray-700'}`}
                  onClick={() => updateSettings({ showDialogues: false })}
                >
                  Off
                </button>
              </div>
            </div>
            
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Sound Volume</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.soundVolume} 
                onChange={(e) => updateSettings({ soundVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Music Volume</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.musicVolume} 
                onChange={(e) => updateSettings({ musicVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Debug Mode</label>
              <div className="flex items-center">
                <button 
                  className={`px-3 py-1 rounded-l ${settings.debugMode ? 'bg-blue-600' : 'bg-gray-700'}`}
                  onClick={() => updateSettings({ debugMode: true })}
                >
                  On
                </button>
                <button 
                  className={`px-3 py-1 rounded-r ${!settings.debugMode ? 'bg-blue-600' : 'bg-gray-700'}`}
                  onClick={() => updateSettings({ debugMode: false })}
                >
                  Off
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              onClick={() => window.location.reload()}
            >
              Restart Game
            </button>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={() => setIsGameMenuOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Selected Dwarf Info */}
      {selectedDwarf && (
        <div className="absolute top-4 right-4 bg-gray-900/80 text-white p-4 rounded-lg pointer-events-auto max-w-xs">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold">{selectedDwarf.name}</h3>
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => selectDwarf(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="mt-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Task:</span>
              <span className="font-medium capitalize">{selectedDwarf.currentTask || 'Idle'}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Health:</span>
                <span>{selectedDwarf.health}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${selectedDwarf.health}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Hunger:</span>
                <span>{selectedDwarf.hunger}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${selectedDwarf.hunger}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Energy:</span>
                <span>{selectedDwarf.energy}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${selectedDwarf.energy}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Happiness:</span>
                <span>{selectedDwarf.happiness}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${selectedDwarf.happiness}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-700">
            <h4 className="text-sm font-medium mb-1">Recent Activities:</h4>
            <div className="text-sm text-gray-300 max-h-32 overflow-y-auto">
              {selectedDwarf.memory && selectedDwarf.memory.length > 0 ? (
                <ul className="space-y-1">
                  {selectedDwarf.memory.slice(-5).map((memory, index) => (
                    <li key={index} className="text-sm text-gray-300">• {memory}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No recent activities recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Game Paused Overlay */}
      {phase === 'paused' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
            <button 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
              onClick={() => resume()}
            >
              Resume (Space)
            </button>
          </div>
        </div>
      )}
      
      {/* We've removed the Building Mode Indicator - dwarves make their own building decisions */}
    </div>
  );
};

export default GameUI;
