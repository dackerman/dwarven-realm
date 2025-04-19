import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  miningSound: HTMLAudioElement | null;
  buildingSound: HTMLAudioElement | null;
  dwarfTalkSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setMiningSound: (sound: HTMLAudioElement) => void;
  setBuildingSound: (sound: HTMLAudioElement) => void;
  setDwarfTalkSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playMining: () => void;
  playBuilding: () => void;
  playDwarfTalk: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  miningSound: null,
  buildingSound: null,
  dwarfTalkSound: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setMiningSound: (sound) => set({ miningSound: sound }),
  setBuildingSound: (sound) => set({ buildingSound: sound }),
  setDwarfTalkSound: (sound) => set({ dwarfTalkSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Update background music if it exists
    if (backgroundMusic) {
      backgroundMusic.volume = newMutedState ? 0 : 0.2;
      
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      }
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playMining: () => {
    const { miningSound, isMuted } = get();
    if (miningSound && !isMuted) {
      // Clone the sound to avoid conflicts
      const soundClone = miningSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.play().catch(error => {
        console.log("Mining sound play prevented:", error);
      });
    }
  },
  
  playBuilding: () => {
    const { buildingSound, isMuted } = get();
    if (buildingSound && !isMuted) {
      // Clone the sound to avoid conflicts
      const soundClone = buildingSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.play().catch(error => {
        console.log("Building sound play prevented:", error);
      });
    }
  },
  
  playDwarfTalk: () => {
    const { dwarfTalkSound, isMuted } = get();
    if (dwarfTalkSound && !isMuted) {
      dwarfTalkSound.currentTime = 0;
      dwarfTalkSound.volume = 0.15;
      dwarfTalkSound.play().catch(error => {
        console.log("Dwarf talk sound play prevented:", error);
      });
    }
  }
}));
