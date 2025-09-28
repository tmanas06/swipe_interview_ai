import { Provider, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ConfigProvider } from 'antd'
import { store, persistor, RootState } from './store'
import AppContent from './components/AppContent'
import WelcomeBackModal from './components/WelcomeBackModal'
import FloatingNavbar from './components/FloatingNavbar'
import './App.css'

function AppContentWrapper() {
  const { darkMode } = useSelector((state: RootState) => state.ui)
  
  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <FloatingNavbar />
      <AppContent />
      <WelcomeBackModal />
    </div>
  )
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#3b82f6',
              borderRadius: 8,
            },
          }}
        >
          <AppContentWrapper />
        </ConfigProvider>
      </PersistGate>
    </Provider>
  )
}

export default App
