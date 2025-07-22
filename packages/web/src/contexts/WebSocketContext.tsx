import { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, WebSocketState, WebSocketActions, WebSocketOptions } from '@/hooks/useWebSocket';

type WebSocketContextType = WebSocketState & WebSocketActions;

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children, options }: { children: ReactNode, options?: WebSocketOptions }) => {
  const webSocket = useWebSocket(options);
  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};