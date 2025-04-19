import React, { useEffect, useRef } from 'react';
import { useDwarves } from '../../lib/stores/useDwarves';
import DialogBubble from './DialogBubble';

interface ConversationDisplayProps {
  maxMessages?: number;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ 
  maxMessages = 5 
}) => {
  const { dwarves = [] } = useDwarves();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll the conversation display when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [dwarves]);
  
  // Get all visible dialogues from all dwarves
  const visibleDialogues = dwarves
    .filter(dwarf => dwarf.dialogueVisible && dwarf.currentDialogue)
    .map(dwarf => ({
      id: dwarf.id,
      name: dwarf.name,
      text: dwarf.currentDialogue || '',
      timestamp: Date.now() // In a more complete implementation, each dialogue would have its own timestamp
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxMessages);
  
  if (visibleDialogues.length === 0) {
    return null; // Don't render anything if there are no conversations
  }
  
  return (
    <div 
      className="absolute left-4 top-20 w-80 max-h-96 overflow-y-auto bg-gray-900/70 p-3 rounded-lg pointer-events-auto"
      ref={containerRef}
    >
      <h3 className="text-white text-lg font-medium mb-2 border-b border-gray-700 pb-1">
        Conversations
      </h3>
      
      <div className="space-y-3">
        {visibleDialogues.map(dialogue => (
          <div key={`${dialogue.id}-${dialogue.timestamp}`} className="animate-fadeIn">
            <DialogBubble 
              text={dialogue.text} 
              name={dialogue.name}
              type="active"
            />
          </div>
        ))}
        
        {visibleDialogues.length === 0 && (
          <p className="text-gray-400 italic text-sm text-center py-4">
            No conversations happening at the moment.
            <br />
            Dwarves will talk to each other as they work.
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationDisplay;