const client = require('../database/connection');

exports.registerUser = async (req, res, next) => {
    // extract all the user information from the request body
    const data = req.body;

    console.log(data);

    res.status(200).json({
        message: "Recieved the email and password",
        success: true
    })
}