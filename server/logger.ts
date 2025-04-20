import fs from 'fs';
import path from 'path';

/**
 * Logger utility for the dwarf fortress simulation
 * Creates log files for OpenAI API requests, dwarf events, and dialogues
 */
export class Logger {
  private baseLogDir: string;
  private sessionLogDir: string;
  private apiLogFile: string;
  private eventLogFile: string;
  private dialogueLogFile: string;
  private initialized: boolean = false;

  constructor() {
    // Create base log directory
    this.baseLogDir = path.join(process.cwd(), 'logs');
    
    // Generate a timestamp for this session
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    this.sessionLogDir = path.join(this.baseLogDir, `session-${timestamp}`);
    
    // Define log file paths
    this.apiLogFile = path.join(this.sessionLogDir, 'openai-api.log');
    this.eventLogFile = path.join(this.sessionLogDir, 'dwarf-events.log');
    this.dialogueLogFile = path.join(this.sessionLogDir, 'dwarf-dialogues.log');
  }

  /**
   * Initialize the logger and create necessary directories and files
   */
  init(): void {
    if (this.initialized) return;
    
    try {
      // Create base log directory if it doesn't exist
      if (!fs.existsSync(this.baseLogDir)) {
        fs.mkdirSync(this.baseLogDir, { recursive: true });
      }
      
      // Create session log directory
      fs.mkdirSync(this.sessionLogDir, { recursive: true });
      
      // Create empty log files with headers
      fs.writeFileSync(this.apiLogFile, '=== OpenAI API Request & Response Log ===\n\n');
      fs.writeFileSync(this.eventLogFile, '=== Dwarf Event Log ===\n\n');
      fs.writeFileSync(this.dialogueLogFile, '=== Dwarf Dialogue Log ===\n\n');
      
      console.log(`Logs initialized in: ${this.sessionLogDir}`);
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing logger:', error);
    }
  }

  /**
   * Format a timestamp for log entries
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Log an OpenAI API request and response
   */
  logApiRequest(
    model: string,
    messages: { role: string; content: string }[],
    response?: string
  ): void {
    if (!this.initialized) this.init();
    
    try {
      const timestamp = this.getTimestamp();
      const logEntry = [
        `[${timestamp}] API REQUEST`,
        `Model: ${model}`,
        'Messages:',
        ...messages.map(m => `  ${m.role}: ${m.content}`),
        response ? `Response: ${response}` : 'No response received',
        '-------------------------------------------\n'
      ].join('\n');
      
      fs.appendFileSync(this.apiLogFile, logEntry);
    } catch (error) {
      console.error('Error logging API request:', error);
    }
  }

  /**
   * Log a dwarf event (decisions, actions, state changes)
   */
  logDwarfEvent(
    dwarfId: number,
    dwarfName: string,
    eventType: string,
    details: string,
    location?: { x: number; y: number }
  ): void {
    if (!this.initialized) this.init();
    
    try {
      const timestamp = this.getTimestamp();
      const locationStr = location ? ` at (${location.x}, ${location.y})` : '';
      const logEntry = `[${timestamp}] DWARF #${dwarfId} (${dwarfName}) ${eventType}${locationStr}: ${details}\n`;
      
      fs.appendFileSync(this.eventLogFile, logEntry);
    } catch (error) {
      console.error('Error logging dwarf event:', error);
    }
  }

  /**
   * Log a dwarf dialogue (what they said)
   */
  logDwarfDialogue(
    dwarfId: number,
    dwarfName: string,
    dialogue: string,
    context?: string
  ): void {
    if (!this.initialized) this.init();
    
    try {
      const timestamp = this.getTimestamp();
      const contextStr = context ? ` [${context}]` : '';
      const logEntry = `[${timestamp}] ${dwarfName} (Dwarf #${dwarfId})${contextStr}: "${dialogue}"\n`;
      
      fs.appendFileSync(this.dialogueLogFile, logEntry);
    } catch (error) {
      console.error('Error logging dwarf dialogue:', error);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();