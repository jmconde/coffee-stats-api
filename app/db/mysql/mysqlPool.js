const mysql = require('promise-mysql');

const {
  LSA_MYSQL_HOST,
  LSA_MYSQL_PORT,
  LSA_MYSQL_USER,
  LSA_MYSQL_PASS,
  LSA_MYSQL_DB,
  LSA_MYSQL_CONN_LIMIT,
} = process.env;

const config = {
  connectionLimit: LSA_MYSQL_CONN_LIMIT,
  host: LSA_MYSQL_HOST,
  port: LSA_MYSQL_PORT,
  user: LSA_MYSQL_USER,
  password: LSA_MYSQL_PASS,
  database: LSA_MYSQL_DB
};

let pool; //bunyan for logger

async function getMysqlPool() {
  try {
    if (!pool) {
      pool = await mysql.createPool(config);
    }
    return pool;
  } catch (err) {
    console.log('error', err);
  }
}


const query = async(sql) => {
  try {
    const pool = await getMysqlPool();
    return pool.query(sql);
  } catch (err) {
    console.log('error', err);
  }
}

module.exports = {
  getMysqlPool,
  query
};