const { mongoExecute } = require("./mongoDBPool");

const colName = 'pilots_ref';

async function getUserFromReferenceTable(vid) {
  return await mongoExecute(async({ collection }) => {
    return await collection.findOne({ vid });
  }, { colName });
}

async function getAllUsersFromReferenceTable() {
  return await mongoExecute(async({ collection }) => {
    return await collection.find({}).toArray();
  }, { colName });
}

module.exports = {
  getUserFromReferenceTable,
  getAllUsersFromReferenceTable,
};