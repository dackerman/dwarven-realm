import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GameSettings, OverlayType, GameWorld } from "../../types/game";

export type GamePhase = "loading" | "ready" | "playing" | "paused" | "ended";

interface GameState {
  phase: GamePhase;
  day: number;
  time: number; // minutes, 0-1440 (24 hours)
  weather: "clear" | "rainy" | "foggy" | "stormy";
  speed: number; // 0 = paused, 1 = normal, 2 = fast, 3 = very fast
  
  // Camera controls
  cameraPosition: { x: number, y: number, z: number };
  cameraZoom: number;
  
  // UI and game settings
  settings: GameSettings;
  overlay: OverlayType;
  
  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  end: () => void;
  
  setSpeed: (speed: number) => void;
  advanceTime: (minutes: number) => void;
  setDay: (day: number) => void;
  setWeather: (weather: "clear" | "rainy" | "foggy" | "stormy") => void;
  
  moveCamera: (x: number, y: number, z: number) => void;
  panCamera: (x: number, y: number) => void;
  zoomCamera: (delta: number) => void;
  resetCamera: () => void;
  
  updateSettings: (updates: Partial<GameSettings>) => void;
  setOverlay: (overlay: OverlayType) => void;
  
  // Time utilities
  getCurrentTimeString: () => string;
  isDaytime: () => boolean;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "loading",
    day: 1,
    time: 360, // Start at 6:00 AM
    weather: "clear",
    speed: 1,
    
    cameraPosition: { x: 0, y: 10, z: 10 },
    cameraZoom: 10,
    
    settings: {
      renderDistance: 20,
      soundVolume: 50,
      musicVolume: 30,
      showDialogues: true,
      gamePaused: false,
      timeScale: 1,
      debugMode: false
    },
    
    overlay: "none",
    
    start: () => {
      set({ phase: "playing" });
    },
    
    pause: () => {
      set((state) => {
        // Only transition from playing to paused
        if (state.phase === "playing") {
          return { 
            phase: "paused",
            settings: {
              ...state.settings,
              gamePaused: true
            }
          };
        }
        return {};
      });
    },
    
    resume: () => {
      set((state) => {
        // Only transition from paused to playing
        if (state.phase === "paused") {
          return { 
            phase: "playing",
            settings: {
              ...state.settings,
              gamePaused: false
            }
          };
        }
        return {};
      });
    },
    
    restart: () => {
      set({ 
        phase: "ready", 
        day: 1,
        time: 360,
        weather: "clear",
        speed: 1
      });
    },
    
    end: () => {
      set({ phase: "ended" });
    },
    
    setSpeed: (speed) => {
      set({ speed });
    },
    
    advanceTime: (minutes) => {
      set((state) => {
        const newTime = state.time + minutes;
        
        // Handle day change
        if (newTime >= 1440) {
          return {
            time: newTime % 1440,
            day: state.day + Math.floor(newTime / 1440)
          };
        }
        
        return { time: newTime };
      });
    },
    
    setDay: (day) => {
      set({ day });
    },
    
    setWeather: (weather) => {
      set({ weather });
    },
    
    moveCamera: (x, y, z) => {
      set((state) => ({
        cameraPosition: {
          x: state.cameraPosition.x + x,
          y: state.cameraPosition.y + y,
          z: state.cameraPosition.z + z
        }
      }));
    },
    
    panCamera: (x, y) => {
      set((state) => ({
        cameraPosition: {
          x: state.cameraPosition.x + x,
          y: state.cameraPosition.y,
          z: state.cameraPosition.z + y
        }
      }));
    },
    
    zoomCamera: (delta) => {
      set((state) => ({
        cameraZoom: Math.max(5, Math.min(20, state.cameraZoom + delta))
      }));
    },
    
    resetCamera: () => {
      set({
        cameraPosition: { x: 0, y: 10, z: 10 },
        cameraZoom: 10
      });
    },
    
    updateSettings: (updates) => {
      set((state) => ({
        settings: { ...state.settings, ...updates }
      }));
    },
    
    setOverlay: (overlay) => {
      set({ overlay });
    },
    
    getCurrentTimeString: () => {
      const time = get().time;
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    },
    
    isDaytime: () => {
      const time = get().time;
      return time >= 360 && time < 1080; // 6:00 AM to 6:00 PM
    }
  }))
);
