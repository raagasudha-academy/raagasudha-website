import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import Header from './components/Header'
import Footer from './components/Footer'

import Home from './pages/Home'
import Classes from './pages/Classes'
import About from './pages/About'
import Events from './pages/Events'
import Community from './pages/Community'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Directors from './pages/Directors'
import Governance from './pages/Governance'

import ChatWidget from './components/ChatWidget'

import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
      <BrowserRouter>
        <ScrollToTop />
        <div className="site">
          <Header />

          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/about" element={<About />} />
              <Route path="/directors" element={<Directors />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/events" element={<Events />} />
              <Route path="/community" element={<Community />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>

          <Footer />
          <ChatWidget />
        </div>
      </BrowserRouter>
  )
}

export default App