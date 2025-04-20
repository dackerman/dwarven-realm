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
      
      // Clean up old log sessions - keep only the two most recent
      this.cleanupOldSessions();
      
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
   * Clean up old log sessions, keeping only the 2 most recent (before current)
   */
  private cleanupOldSessions(): void {
    try {
      // Skip if base log directory doesn't exist
      if (!fs.existsSync(this.baseLogDir)) {
        return;
      }
      
      // Get all session directories
      const sessionDirs = fs.readdirSync(this.baseLogDir)
        .filter(dir => dir.startsWith('session-') && dir !== path.basename(this.sessionLogDir))
        .map(dir => ({
          name: dir,
          path: path.join(this.baseLogDir, dir),
          mtime: fs.statSync(path.join(this.baseLogDir, dir)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort newest first
      
      // Delete all but the 2 most recent
      if (sessionDirs.length > 2) {
        const sessionsToDelete = sessionDirs.slice(2);
        sessionsToDelete.forEach(session => {
          this.deleteDirectory(session.path);
        });
      }
    } catch (error) {
      console.error('Error cleaning up old log sessions:', error);
    }
  }
  
  /**
   * Recursively delete a directory and its contents
   */
  private deleteDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      return;
    }
    
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive delete subdirectory
        this.deleteDirectory(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    
    // Delete the now-empty directory
    fs.rmdirSync(dirPath);
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