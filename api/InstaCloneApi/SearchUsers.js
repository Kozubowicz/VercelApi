import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  await client.connect();
  cachedDb = client.db('InstaClone');
  return cachedDb;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { searchPhrase } = req.body || {};

    if (!searchPhrase) {
      return res.status(400).json({ error: 'Missing searchPhrase' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('Users');

    // Wyrażenie regularne do wyszukiwania userName zawierającego frazę (case-insensitive)
    const regexSearch = new RegExp(searchPhrase, 'i');

    const users = await usersCollection
      .find({ userName: { $regex: regexSearch } })
      .limit(10)
      .toArray();

    return res.status(200).json(users);
  } catch (err) {
    console.error('Error in searchUsers handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
