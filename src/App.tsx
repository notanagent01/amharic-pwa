import { Routes, Route } from 'react-router-dom'
import HomeScreen from '@/components/HomeScreen'
import FidelModule from '@/modules/fidel/FidelModule'
import SRSModule from '@/modules/srs/SRSModule'
import VocabModule from '@/modules/vocab/VocabModule'
import GrammarModule from '@/modules/grammar/GrammarModule'
import DialogueModule from '@/modules/dialogue/DialogueModule'
import SettingsScreen from '@/components/SettingsScreen'
import BottomNav from '@/components/BottomNav'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/fidel" element={<FidelModule />} />
          <Route path="/srs" element={<SRSModule />} />
          <Route path="/vocab" element={<VocabModule />} />
          <Route path="/grammar" element={<GrammarModule />} />
          <Route path="/dialogue" element={<DialogueModule />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
