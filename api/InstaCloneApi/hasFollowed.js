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
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, profileId } = req.body || {};

    if (!userId || !profileId) {
      return res.status(400).json({ error: 'Missing userId or profileId' });
    }

    const db = await connectToDatabase();
    const followsCollection = db.collection('Follows');

    const userFollows = await followsCollection.findOne({ userId });

    const hasFollow =
      userFollows?.follows?.some((follow) => follow._id === profileId) || false;

    return res.status(200).json(hasFollow);
  } catch (err) {
    console.error('Error in checkFollow handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
