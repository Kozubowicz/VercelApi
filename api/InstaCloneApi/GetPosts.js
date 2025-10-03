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

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { page = 0 } = req.body || {};
    const db = await connectToDatabase();
    const postsCollection = db.collection('Posts');

    const posts = await postsCollection
      .find({})
      .skip(page * 10)
      .limit(10)
      .toArray();

    const totalPosts = await postsCollection.countDocuments();
    const pagesNumber = Math.ceil(totalPosts / 10);

    const userIds = posts
      .map((post) => {
        try {
          return new ObjectId(post.userId);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const usersCollection = db.collection('Users');
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

    posts.forEach((post) => {
      const userId = post.userId.toString();
      if (userMap[userId]) {
        post.userName = userMap[userId].userName;
        post.profileImg = userMap[userId].profileImg;
      }
    });

    return res.status(200).json({ posts, pagesNumber });
  } catch (err) {
    console.error('Error in handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
