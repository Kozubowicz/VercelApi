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
    const { commentId, userId } = req.body || {};

    if (!commentId || !userId) {
      return res.status(400).json({ error: 'Missing commentId or userId' });
    }

    const db = await connectToDatabase();
    const commentsCollection = db.collection('Comments');

    const comment = await commentsCollection.findOne({
      _id: new ObjectId(commentId),
    });

    if (!comment) {
      return res.status(404).json({ success: false });
    }

    if (comment.Author._id !== userId) {
      return res.status(403).json({ success: false });
    }

    const deleteResult = await commentsCollection.deleteOne({
      _id: new ObjectId(commentId),
    });

    if (deleteResult.deletedCount === 1) {
      return res.status(200).json({ success: true, deletedId: commentId });
    } else {
      return res.status(500).json({ success: false });
    }
  } catch (err) {
    console.error('Error in deleteComment handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
