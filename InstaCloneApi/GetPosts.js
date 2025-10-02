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
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Read the body (Vercel automatically parses JSON when POSTing)
    const { page = 0 } = req.body || {};

    const db = await connectToDatabase();

    // Download all posts
    const postsCollection = db.collection('Posts');
    const allPosts = await postsCollection.find({}).toArray();

    // Paging
    const posts = allPosts.slice(page * 10, page * 10 + 10);

    // Geting users data
    const userIds = posts.map((post) => new ObjectId(post.userId));
    const usersCollection = db.collection('Users');
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    // Creating users map
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = {
        userName: user.userName,
        profileImg: user.profileImg,
      };
    });

    // Attaching users data
    posts.forEach((post) => {
      const userId = post.userId.toString();
      if (userMap[userId]) {
        post.userName = userMap[userId].userName;
        post.profileImg = userMap[userId].profileImg;
      }
    });

    const pagesNumber = Math.ceil(allPosts.length / 10);

    return res.status(200).json({ posts, pagesNumber });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
