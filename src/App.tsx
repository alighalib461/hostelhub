import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './app/providers/QueryProvider'
import { AuthProvider } from './app/providers/AuthProvider'
import { HostelProvider } from './app/providers/HostelProvider'
import { AppRouter } from './app/router/AppRouter'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <HostelProvider>
            <AppRouter />
          </HostelProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}

export default App
