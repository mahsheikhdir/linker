const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'linkup',
    password: '1234',
    port: 5432

})
module.exports = {
  query: (text, params, callback) => {
    const start = Date.now();
    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      console.log('Executed query', {text, params, duration});
      callback(err, res);
    })
  },
  asyncQuery: async (text, params, callback) => {
    const start = Date.now();
    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      console.log('Executed query', {text, params, duration});
      callback(err, res);
    })
  },
  pool,
}