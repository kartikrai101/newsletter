const client = require("../database/connection");
const validator = require('validator');
const bcrypt = require('bcryptjs');

//validator.isEmail('foo@bar.com');

exports.register = async (req, res, next) => {
    // this is the API that will register the company
    const {name, address, linkedinUrl, websiteUrl, email, password, contact1, contact2}  = req.body;

    console.log(name, email);

    res.status(201).json({
        success: true,
        message: "Company registered"
    })
}