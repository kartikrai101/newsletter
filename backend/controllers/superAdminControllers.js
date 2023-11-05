const client = require("../database/connection");
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require("../models");
const jwt = require('jsonwebtoken')
require('dotenv').config()

// ------------------------ controller functions -----------------------------

exports.createAdmin = async (req, res) => {
    try{
        // take the user id from params and change the role of that user to admin
        const user = await User.findOne({
            where: {
                user_id: req.params.id
            }
        })

        const updatedRole = await User.update({
            role: "admin"
        }, {
            where: {
                user_id: req.params.id
            }
        })

        res.status(201).json({
            success: true,
            message: "user updated to admin!"
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not change the role to admin!",
            err
        })
    }
}

exports.createUser = async (req, res) => {
    try{
        const admin = await User.findOne({
            where: {
                user_id: req.params.id
            }
        })

        const updatedRole = await User.update({
            role: "user"
        }, {
            where: {
                user_id: req.params.id
            }
        })

        res.status(201).json({
            success: true,
            message: "admin updated to user!"
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not change the role to user!"
        })
    }
}



// hj
// --------------------------- handler functions ----------------------------

exports.authenticateSuperAdmin = async (req, res, next) => {
    // extract the access token from the request header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    if(token === null) return res.status(403).json({success: false, message: "Access token not found!"})

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, token_data) => {
        if(err) return res.status(403).json({success: false, message: "this one", err})

        if(token_data.role !== "super") return res.status(401).json({success: false, message: "unauthorized access!"})

        req.user = token_data;
        next();
    }) 
}