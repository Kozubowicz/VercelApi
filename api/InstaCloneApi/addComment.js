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
    const { postId, userId, commentBody } = req.body || {};

    if (!postId || !userId || !commentBody) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await connectToDatabase();
    const commentsCollection = db.collection('Comments');

    const comment = {
      commentBody,
      postId,
      Author: { _id: new ObjectId(userId) }, // cast to ObjectId
      createdAt: new Date(),
    };

    const result = await commentsCollection.insertOne(comment);

    if (!result.insertedId) {
      return res
        .status(400)
        .json({ success: false, error: 'Failed to insert comment' });
    }

    return res.status(200).json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error('Error inserting comment:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
