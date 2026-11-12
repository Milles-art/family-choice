import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './design-system.css';
import './redesign.css';
import './home-lower.css';
import './shop.css';
import './about.css';
import './contact.css';
import './delivery.css';
import './polish.css';
import './motion.css';
import './payments.css';
import './footer.css';
import './mobile.css';
import { initReveal } from './reveal';

initReveal();

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
import './light-adaptation.css';
import './reference-design.css';
