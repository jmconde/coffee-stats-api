const { MongoClient } = require('mongodb');
const {
  MONGO_HOST,
  MONGO_PORT,
  MONGO_USER,
  MONGO_PASS,
  MONGO_DB,
} = process.env;

const uri = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/?maxPoolSize=20`;

const getMongoConnection = async() => {
  const client = new MongoClient(uri);
  return await client.connect();
};

const getMongoDatabase = (client, db) => {
  const DB = db || MONGO_DB;
  return client.db(DB);
};

const mongoExecute = async function(fn, opts) {
  const { dbName, colName } = { dbName: MONGO_DB, ...opts };
  let connection;
  try {
    connection = await getMongoConnection();
    const database = connection.db(dbName);
    if (colName) {
      const collection = database.collection(colName);
      return await fn({ collection, database, connection });
    }
    return await fn({ database, connection });
  } catch (err) {
    // console.log('err :>> ', err);
    console.log('MOMGODB ERROR:', err.message);
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

module.exports = {
  mongoExecute,
  getMongoConnection,
  getMongoDatabase,
};