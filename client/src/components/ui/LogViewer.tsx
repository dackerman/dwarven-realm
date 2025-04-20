import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/queryClient';

type LogEntry = {
  timestamp: string;
  content: string;
};

type LogType = 'events' | 'dialogues' | 'api';

interface LogViewerProps {
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
  const [logType, setLogType] = useState<LogType>('events');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch available log sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/logs/sessions');
        const data = await response.json();
        setSessions(data.sessions || []);
        
        // Set current session to the most recent one
        if (data.sessions && data.sessions.length > 0) {
          setCurrentSession(data.sessions[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch log sessions:', error);
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, []);

  // Fetch logs when logType or session changes
  useEffect(() => {
    if (!currentSession) return;
    
    const fetchLogs = async () => {
      try {
        setLoading(true);
        
        let endpoint = '';
        switch (logType) {
          case 'events':
            endpoint = '/api/logs/events';
            break;
          case 'dialogues':
            endpoint = '/api/logs/dialogues';
            break;
          case 'api':
            endpoint = '/api/logs/api';
            break;
        }
        
        const response = await apiRequest('GET', `${endpoint}?session=${currentSession}`);
        const data = await response.json();
        
        // Parse logs into LogEntry format
        const parsedLogs: LogEntry[] = data.logs.map((log: string) => {
          // Extract timestamp if it exists in the format [timestamp]
          const timestampMatch = log.match(/\[(.*?)\]/);
          
          if (timestampMatch && timestampMatch.length > 1) {
            return {
              timestamp: timestampMatch[1],
              content: log.replace(timestampMatch[0], '').trim()
            };
          }
          
          return {
            timestamp: '',
            content: log
          };
        });
        
        setLogs(parsedLogs);
        setLoading(false);
      } catch (error) {
        console.error(`Failed to fetch ${logType} logs:`, error);
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [logType, currentSession]);

  // This handler prevents events from propagating to the game underneath
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 pointer-events-auto"
      onClick={stopPropagation}
    >
      <div 
        className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={stopPropagation}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Dwarf Fortress Logs</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
        
        <div className="flex border-b border-gray-700">
          <button 
            className={`px-4 py-2 ${logType === 'events' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              setLogType('events');
            }}
          >
            Dwarf Events
          </button>
          <button 
            className={`px-4 py-2 ${logType === 'dialogues' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              setLogType('dialogues');
            }}
          >
            Dwarf Dialogues
          </button>
          <button 
            className={`px-4 py-2 ${logType === 'api' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              setLogType('api');
            }}
          >
            API Requests
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-700">
          <select 
            value={currentSession} 
            onChange={(e) => {
              e.stopPropagation();
              setCurrentSession(e.target.value);
            }}
            className="bg-gray-700 text-white p-2 rounded w-full"
            onClick={stopPropagation}
          >
            {sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4" onClick={stopPropagation}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No logs available for this session.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="bg-gray-900 p-3 rounded">
                  {log.timestamp && (
                    <div className="text-xs text-gray-500 mb-1">{log.timestamp}</div>
                  )}
                  <div className="text-white whitespace-pre-wrap">{log.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;