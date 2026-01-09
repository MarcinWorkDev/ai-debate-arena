import { Scene } from './components/canvas/Scene'
import { ChatPanel } from './components/chat/ChatPanel'
import { Header } from './components/ui/Header'
import { TopicInput } from './components/ui/TopicInput'
import { ControlButtons } from './components/ui/ControlButtons'
import { RoundsInput } from './components/ui/RoundsInput'
import './styles/globals.css'

function App() {
  return (
    <div className="flex w-full h-full bg-slate-950">
      {/* Left side - 3D Scene with controls */}
      <div className="relative w-1/2 h-full">
        <Scene />
        
        {/* Header - only on left side */}
        <Header />

        {/* Control Panel - Bottom left */}
        <div className="absolute left-4 bottom-4 right-4 z-10">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-800 p-4 space-y-4 shadow-xl">
            <TopicInput />
            <div className="flex items-center gap-4">
              <ControlButtons />
              <RoundsInput />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Chat Panel */}
      <div className="w-1/2 h-full border-l border-slate-800">
        <ChatPanel />
      </div>
    </div>
  )
}

export default App
