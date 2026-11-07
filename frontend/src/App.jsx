import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { JourneyProvider } from './context/JourneyContext';
import { VoiceProvider } from './context/VoiceContext';
import { SidebarProvider } from './context/SidebarContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <JourneyProvider>
            <VoiceProvider>
              <SidebarProvider>
                <AppRoutes />
              </SidebarProvider>
            </VoiceProvider>
          </JourneyProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
