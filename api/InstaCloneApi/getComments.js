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
    const { postId, page = 1 } = req.body || {};
    const commentsLimit = 5;

    if (!postId) {
      return res.status(400).json({ error: 'Missing postId' });
    }

    const db = await connectToDatabase();
    const commentsCollection = db.collection('Comments');
    const usersCollection = db.collection('Users');

    const commentsLength = await commentsCollection.countDocuments({ postId });

    const comments = await commentsCollection
      .find({ postId })
      .sort({ _id: -1 })
      .skip((page - 1) * commentsLimit)
      .limit(commentsLimit)
      .toArray();

    const userIds = comments
      .map((comment) => {
        try {
          return new ObjectId(comment.Author._id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = {
        userName: user.userName,
        profileImg: user.profileImg,
      };
    });

    comments.forEach((comment) => {
      const userId = comment.Author._id.toString();
      if (userMap[userId]) {
        comment.Author.userName = userMap[userId].userName;
        comment.Author.profileImg = userMap[userId].profileImg;
      }
    });

    const pagesNumber = Math.ceil(commentsLength / commentsLimit);

    return res.status(200).json({
      comments,
      isMore: pagesNumber > page,
    });
  } catch (err) {
    console.error('Error in comments handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
