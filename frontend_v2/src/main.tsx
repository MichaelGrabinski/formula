import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { GoalsApp } from './modules/GoalsApp';

const mount = document.getElementById('goals-v2-root');
declare global { interface Window { GOALS_BOOTSTRAP?: any } }
if (mount) {
  const data = window.GOALS_BOOTSTRAP || [];
  createRoot(mount).render(<GoalsApp initialGoals={data} />);
} else {
  console.warn('Goals V2 root element not found');
}
