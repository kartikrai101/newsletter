const dotenv = require('dotenv');
dotenv.config();

const postgres = {
    options: {
        username: 'postgres',
        host: 'localhost',
        database: 'newsletter',
        password: process.env.DbPass,
        port: 5432,
        dialect: 'postgres',
        logging: false // to prevent logging on the console all the queries that are being performed
    },
    client: null,
}

module.exports = postgres;