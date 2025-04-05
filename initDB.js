const pg = require('pg');

module.exports = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'mbook',
    user: 'postgres',
    password: '123'
});
