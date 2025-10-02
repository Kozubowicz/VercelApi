// api/users.js  -- prosty CRUD dla kolekcji "users"
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI; // <- ustawiasz w Vercel
const dbName = process.env.MONGODB_DB || 'myDatabase';

let cachedClient = globalThis._mongoClient || null;
let cachedDb = globalThis._mongoDb || null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };

  if (!uri) throw new Error('MONGODB_URI is not set in env');

  const client = new MongoClient(uri); // opcjonalnie możesz dodać opcje pool
  await client.connect();
  const db = client.db(dbName);

  // cache globally to reuse between function invocations (serverless warm reuse)
  globalThis._mongoClient = client;
  globalThis._mongoDb = db;

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

module.exports = async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const col = db.collection('users');

    if (req.method === 'GET') {
      const docs = await col.find({}).toArray();
      return res.status(200).json(docs);
    }

    if (req.method === 'POST') {
      // obsługa zarówno req.body (jeśli już zparsowane) jak i surowego JSON
      let payload;
      try {
        payload =
          typeof req.body === 'object'
            ? req.body
            : JSON.parse(req.body || '{}');
      } catch {
        payload = {};
      }

      const result = await col.insertOne(payload);
      return res.status(201).json({ insertedId: result.insertedId });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
