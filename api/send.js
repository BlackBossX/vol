const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(uri) {
  if (!uri) throw new Error('MONGO_URI not provided');
  if (cachedDb) return { client: cachedClient, db: cachedDb };

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(); // DB from URI or default
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

module.exports = async (req, res) => {
  // Basic CORS handling (Vercel also can set headers globally)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    // Accept legacy field names or new ones
    const data = {
      volt: typeof body.volt !== 'undefined' ? Number(body.volt) : (body.value1 ? Number(body.value1) : undefined),
      amps: typeof body.amps !== 'undefined' ? Number(body.amps) : (body.value2 ? Number(body.value2) : undefined),
      watt: typeof body.watt !== 'undefined' ? Number(body.watt) : (body.value3 ? Number(body.value3) : undefined),
      temperature: typeof body.temperature !== 'undefined' ? Number(body.temperature) : undefined,
      humidity: typeof body.humidity !== 'undefined' ? Number(body.humidity) : undefined,
      time: new Date()
    };

    // remove undefined fields
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid sensor fields in body' });
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) return res.status(500).json({ error: 'Server misconfigured: MONGO_URI not set' });

    const { db } = await connectToDatabase(mongoUri);
    const collection = db.collection('sensors');
    const result = await collection.insertOne(data);

    return res.status(201).json({ message: 'Data saved', id: result.insertedId, data });
  } catch (err) {
    console.error('API /send error:', err);
    return res.status(500).json({ error: err.message });
  }
};
