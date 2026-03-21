// api/_db.js — Neon Postgres helper for Vercel serverless functions
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Add it in Vercel project settings → Environment Variables.');
}

const sql = neon(process.env.DATABASE_URL);
module.exports = { sql };
