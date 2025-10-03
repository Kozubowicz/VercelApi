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
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { postId, userId } = req.body || {};

    if (!postId || !userId) {
      return res.status(400).json({ error: 'Missing postId or userId' });
    }

    const db = await connectToDatabase();
    const postsCollection = db.collection('Posts');

    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res
        .status(404)
        .json({ error: 'There is no post with this id in database' });
    }

    const hasLiked = post.likes?.some((id) => id === userId) || false;

    return res.status(200).json({ hasLiked });
  } catch (err) {
    console.error('Error in checkPostLike handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
