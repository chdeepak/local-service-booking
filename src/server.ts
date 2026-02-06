import express from 'express';
import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;

export async function startServer() {
  const app = createApp();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
