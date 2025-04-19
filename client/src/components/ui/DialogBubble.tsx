import React, { useState, useEffect } from 'react';

interface DialogBubbleProps {
  text: string;
  name?: string;
  type?: 'active' | 'neutral' | 'muted';
}

const DialogBubble: React.FC<DialogBubbleProps> = ({ 
  text, 
  name,
  type = 'neutral'
}) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide dialogue after a delay
  useEffect(() => {
    if (!text) {
      setVisible(false);
      return;
    }
    
    setVisible(true);
    
    // Keep dialogue visible for longer text
    const timeout = Math.max(3000, text.length * 100);
    
    const timer = setTimeout(() => {
      setVisible(false);
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [text]);
  
  if (!visible || !text) return null;
  
  return (
    <div 
      className="relative px-3 py-2 rounded-lg shadow-md max-w-[200px] text-center transform-gpu"
      style={{
        backgroundColor: type === 'active' ? '#FFFFCC' : 
                        type === 'muted' ? '#CCCCCC' : '#FFFFFF',
        border: '2px solid #333333',
        animation: 'bounce 0.5s',
        transform: 'scale(1)'
      }}
    >
      {/* Dialogue pointer */}
      <div 
        className="absolute w-4 h-4 rotate-45 bg-inherit border-b-2 border-r-2 border-[#333333]"
        style={{
          bottom: '-8px',
          left: 'calc(50% - 8px)',
        }}
      />
      
      {/* Name tag */}
      {name && (
        <div className="text-xs font-bold text-gray-700 mb-1">
          {name}
        </div>
      )}
      
      {/* Dialogue text */}
      <div className="text-sm font-medium text-gray-800">
        {text}
      </div>
    </div>
  );
};

export default DialogBubble;
