// Entrada serverless da Vercel — reaproveita o app Express.
// A Vercel serve o /public estático pela CDN; só /api/* chega aqui.
import app from '../src/server.js';

export default app;
