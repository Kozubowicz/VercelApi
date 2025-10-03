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
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('Users');
    const postsCollection = db.collection('Posts');

    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: 'There is no user with this id in database' });
    }

    const posts = await postsCollection.find({ userId }).toArray();

    const responseObj = {
      ...user,
      posts,
    };

    return res.status(200).json(responseObj);
  } catch (err) {
    console.error('Error in getUserWithPosts handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
