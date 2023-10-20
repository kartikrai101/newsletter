const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();

// configuring dotenv
dotenv.config();

// body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Route imports


// listening to port 8000
app.listen(8000, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})