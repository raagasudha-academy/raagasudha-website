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
import Registration from './pages/Registration'

import ChatWidget from './components/ChatWidget'

import './App.css'

const pageMeta = {
  '/': {
    title: 'Raaga Sudha Music Academy | Carnatic Music in North East England',
    description: 'Explore Carnatic music classes, performances and community activities with Raaga Sudha Music Academy in Newcastle, Durham, Middlesbrough and online.',
  },
  '/classes': {
    title: 'Carnatic Music Classes | Raaga Sudha Music Academy',
    description: 'Explore Raaga Sudha Carnatic music classes in Newcastle, Durham, Middlesbrough and online.',
  },
  '/registration': {
    title: 'Student Registration | Raaga Sudha Music Academy',
    description: 'Register a student to begin their musical journey with Raaga Sudha Music Academy.',
  },
  '/events': {
    title: 'Events & Performances | Raaga Sudha Music Academy',
    description: 'Discover performances, Pradarshana and community events from Raaga Sudha Music Academy.',
  },
  '/community': {
    title: 'Community | Raaga Sudha Music Academy',
    description: 'Discover how Raaga Sudha uses music to create connection, confidence, creativity and inclusion.',
  },
  '/gallery': {
    title: 'Gallery | Raaga Sudha Music Academy',
    description: 'Explore photographs from Raaga Sudha classes, performances and community activities.',
  },
  '/about': {
    title: 'Our Story | Raaga Sudha Music Academy',
    description: 'Learn about the story, values and teaching approach behind Raaga Sudha Music Academy.',
  },
  '/directors': {
    title: 'Directors | Raaga Sudha Music Academy',
    description: 'Meet the directors supporting Raaga Sudha Music Academy and its community work.',
  },
  '/governance': {
    title: 'Governance | Raaga Sudha Music Academy',
    description: 'View Raaga Sudha Music Academy governance information, policies and organisational documents.',
  },
  '/contact': {
    title: 'Contact | Raaga Sudha Music Academy',
    description: 'Contact Raaga Sudha Music Academy about classes, registration, events and community activities.',
  },
}

function PageMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = pageMeta[pathname] || pageMeta['/']
    document.title = meta.title

    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', meta.description)
  }, [pathname])

  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
      <BrowserRouter
          basename={
            import.meta.env.BASE_URL === '/'
                ? '/'
                : import.meta.env.BASE_URL.replace(/\/$/, '')
          }
      >
        <ScrollToTop />
        <PageMeta />
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
              <Route path="/registration" element={<Registration />} />
            </Routes>
          </main>

          <Footer />
          <ChatWidget />
        </div>
      </BrowserRouter>
  )
}

export default App