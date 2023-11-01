const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();
const sequelize = require('./database/connection');
const Model = require('./models');

// configuring dotenv
dotenv.config();

// body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Route imports
const superAdmin = require('./routes/superAdminRoutes');
const company = require('./routes/companyRoutes');
const user = require('./routes/userRoutes');
const search = require('./routes/searchingRoutes');

app.use('/api/user', user)
app.use('/api/superadmin', superAdmin)
app.use('/api/company', company)
app.use('/api/search', search)

// listening to port 8000
app.listen(8000, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})

try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
}catch (error) {
  console.error('Unable to connect to the database:', error);
} 
