const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();
const client = require('./database/connection');
const sequelize = require('./database/connection');
const Model = require('./models');

// configuring dotenv
dotenv.config();

// body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Route imports
const employee = require('./routes/employeeRoutes');
const superAdmin = require('./routes/superAdminRoutes');
const admin = require('./routes/adminRoutes');

app.use('/api/employee', employee)
app.use('/api/super-admin', superAdmin)
app.use('/api/admin', admin)

// listening to port 8000
app.listen(8000, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})

try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } 
