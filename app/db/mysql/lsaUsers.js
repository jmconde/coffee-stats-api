const { query } = require("./mysqlPool");

async function getUsers() {
  const sql = `SELECT u.name,
    u.country, u.flights, u.flight_time AS flightTime, ufv.value as vid, u.email
    FROM users AS u
    INNER JOIN user_field_values AS ufv
      ON u.id = ufv.user_id 
    WHERE ufv.user_field_id = 1`;

  const result = await query(sql);
  return result;
}

async function getUsersWhitelist() {
  const sql = `SELECT ufv.value as vid, u.name, u.flights, u.flight_time AS flightTime
    FROM users AS u
    INNER JOIN user_field_values AS ufv
      ON u.id = ufv.user_id 
    WHERE ufv.user_field_id = 1 AND u.flight_time > 60 * 200 AND u.state = 1`;

  const result = await query(sql);
  return result;
}

module.exports = {
  getUsers,
  getUsersWhitelist,
}