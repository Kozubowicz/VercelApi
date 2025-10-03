import { MongoClient, ObjectId } from 'mongodb';

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
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'There is no userId in request' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('Users');

    let user;
    try {
      user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    } catch (e) {
      return res
        .status(400)
        .json({ error: 'Invalid userId format (must be ObjectId)' });
    }

    if (!user) {
      return res
        .status(404)
        .json({ error: 'There is no user with this id in database' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Error in handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
