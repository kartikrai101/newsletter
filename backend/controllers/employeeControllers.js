const client = require('../database/connection');

exports.registerEmployee = (req, res, next) => {
    const data = req.body;
    res.status(201).json({
        success: true,
        data
    })
}