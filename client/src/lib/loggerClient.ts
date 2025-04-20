/**
 * Client-side logger utility for sending events to the server-side logger
 */

import { apiRequest } from './queryClient';

/**
 * Log a dwarf event (decision, action, movement, etc.)
 */
export async function logDwarfEvent(
  dwarfId: number,
  dwarfName: string,
  eventType: string,
  details: string,
  location?: { x: number; y: number }
): Promise<void> {
  try {
    await apiRequest(
      'POST',
      '/api/log/event',
      {
        dwarfId,
        dwarfName,
        eventType,
        details,
        location
      }
    );
  } catch (error) {
    console.error('Failed to log dwarf event:', error);
  }
}

/**
 * Log a dwarf's dialogue
 */
export async function logDwarfDialogue(
  dwarfId: number,
  dwarfName: string,
  dialogue: string,
  context?: string
): Promise<void> {
  try {
    await apiRequest(
      'POST',
      '/api/log/dialogue', 
      {
        dwarfId,
        dwarfName,
        dialogue,
        context
      }
    );
  } catch (error) {
    console.error('Failed to log dwarf dialogue:', error);
  }
}