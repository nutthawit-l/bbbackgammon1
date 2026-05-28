import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { extend } from '@pixi/react'
import { Container, Sprite, Graphics } from 'pixi.js'
import './index.css'
import App from './App'

extend({ Container, Sprite, Graphics })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
