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
    const { userId, page = 1 } = req.body || {};
    const limit = 3;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = await connectToDatabase();
    const followsCollection = db.collection('Follows');
    const usersCollection = db.collection('Users');

    const userFollows = await followsCollection.findOne({ userId });

    if (!userFollows) {
      return res.status(200).json({ follows: [], isMore: false });
    }

    const followsLength = userFollows.follows.length;

    const start = (page - 1) * limit;
    const follows = userFollows.follows.slice(start, start + limit);

    const userIds = follows
      .map((follow) => {
        try {
          return new ObjectId(follow._id);
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

    follows.forEach((follow) => {
      if (userMap[follow._id]) {
        follow.userName = userMap[follow._id].userName;
        follow.profileImg = userMap[follow._id].profileImg;
      }
    });

    return res.status(200).json({
      follows,
      isMore: followsLength > page * limit,
    });
  } catch (err) {
    console.error('Error in follows handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
