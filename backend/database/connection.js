const dotenv = require('dotenv');
const {Sequelize} = require('sequelize');
const postgres = require('./config');

dotenv.config();
let sequelize = new Sequelize(postgres.options);

module.exports = sequelize;


