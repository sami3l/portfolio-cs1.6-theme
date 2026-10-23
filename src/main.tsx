import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { portfolio } from './data/portfolio';
import './styles/tokens.css';
import './styles/vgui.css';
import './styles/app.css';
import './styles/windows.css';
import './styles/resume.css';

document.title = `${portfolio.profile.name} · ${portfolio.profile.title}`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
