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
  pquery: (text, params) => {
    const start = Date.now();
    return new Promise((resolve,reject) => {
      pool.query(text, params, (err, res) => {
        if(err) {
          reject(err);
        }
        const duration = Date.now() - start;
        console.log('Executed query', {text, params, duration});
        resolve(res);
      })
    });
  },
  pool,
}