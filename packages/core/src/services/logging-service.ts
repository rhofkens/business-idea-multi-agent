import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  agent?: string;
  details?: string;
}

/**
 * A simple CSV logging service.
 */
class LoggingService {
  private logFilePath: string;
  private readonly logHeaders = '"timestamp","level","message","agent","details"\\n';

  constructor() {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    this.logFilePath = path.join(logDir, `run_${new Date().toISOString().replace(/:/g, '-')}.csv`);
    this.initializeLogFile();
  }

  private initializeLogFile() {
    fs.writeFileSync(this.logFilePath, this.logHeaders, 'utf-8');
  }

  private formatCsvRow(entry: LogEntry): string {
    const { timestamp, level, message, agent = '', details = '' } = entry;
    const cleanMessage = message.replace(/"/g, '""');
    const cleanDetails = details.replace(/"/g, '""');
    return `"${timestamp}","${level}","${cleanMessage}","${agent}","${cleanDetails}"\\n`;
  }

  public log(entry: Omit<LogEntry, 'timestamp'>) {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    const row = this.formatCsvRow(fullEntry);
    fs.appendFileSync(this.logFilePath, row, 'utf-8');
  }
}

export const loggingService = new LoggingService();