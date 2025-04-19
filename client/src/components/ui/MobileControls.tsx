import React from 'react';
import { useGame } from '../../lib/stores/useGame';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const ControlButton: React.FC<ButtonProps> = ({ onClick, children, className = '' }) => (
  <button
    className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-full shadow-lg active:scale-95 transition-transform ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const MobileControls: React.FC = () => {
  const { panCamera, zoomCamera } = useGame();
  
  return (
    <div className="fixed bottom-4 w-full flex justify-center z-50">
      <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 flex flex-col gap-2">
        <div className="flex justify-center space-x-2">
          <ControlButton onClick={() => panCamera(0, -0.5)}>↑</ControlButton>
        </div>
        <div className="flex justify-between space-x-4">
          <ControlButton onClick={() => panCamera(-0.5, 0)}>←</ControlButton>
          <ControlButton onClick={() => panCamera(0.5, 0)}>→</ControlButton>
        </div>
        <div className="flex justify-center space-x-2">
          <ControlButton onClick={() => panCamera(0, 0.5)}>↓</ControlButton>
        </div>
        <div className="flex justify-between space-x-2 mt-2">
          <ControlButton onClick={() => zoomCamera(-0.5)} className="flex-1">+</ControlButton>
          <ControlButton onClick={() => zoomCamera(0.5)} className="flex-1">-</ControlButton>
        </div>
      </div>
    </div>
  );
};

export default MobileControls;