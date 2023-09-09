const axios = require('axios');

const request = async(url, options) => {
  const response = await axios.get(url, options);
  return response.data;
};

module.exports = {
  request,
};