const express = require('express');
const app = express();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Company_details = require('../models/companyDetailsModel');
const Post = require('../models/postModel');
const nodemailer = require('nodemailer');
require('dotenv').config();
const validator = require('validator');
const jwt = require('jsonwebtoken');
const Like = require('../models/likeModel');



// ---------------------- controller functions ---------------------------

exports.register = async (req, res) => {
    const userData = req.body;
    try{
        // extract all the user data and save the user info 
        
        // first of all we need to check if a company with this domain even exists
        const email = userData.email;
        let domain = "";
        let i = 0;
        while(email[i] !== '@' && i < email.length) i++;
        while(i !== email.length){
            domain += email[i];
            i++;
        }
        if(domain === "")
            return res.status(401).json({
                success: false,
                message: "invalid email address!"
            })

        const company = await Company_details.findOne({
            where: {
                domain_access: domain
            }
        })

        if(company === null){
            return res.status(401).json({
                success: false,
                message: "unregistered company email domain!"
            })
        }

        // we also need to check if there's already a registration with this email address
        const isValid = await User.findOne({
            where: {
                email: userData.email
            }
        })

        if(isValid !== null) 
            return res.status(401).json({
                success: false,
                message: "email address already exists!"
            })
        
        // hash the password before saving it using bcrypt
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user_id = uuidv4();
        const response = await User.create({
            user_id: user_id,
            fname: userData.fname,
            lname: userData.lname,
            email: userData.email,
            password: hashedPassword,
            company_id: company.dataValues.company_id
        })

        //now that the user is registered, we need to verify the user's email using nodemailer
        await verifyMailHandler(userData.email, user_id);

        res.status(201).json({
            success: true,
            message: "User registered!",
            response
        })

    }catch(err){
        res.status(401).json({
            success: false,
            error: err
        })
    }
}

exports.verifyEmail = async (req, res) => {
    // extract the user_id from the query string
    try{
        const user_id = req.query.id;
        const updatedInfo = await User.update({is_verified: true},{
            where: {
                user_id: user_id
            }
        });

        res.status(201).json({
            message: "email verified",
            success: true
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "Could not verify user",
            err
        })
    }
}

exports.login = async (req, res) => {

    try{
        const {email, password} = req.body;

        // check if the email is valid or not
        if(!validator.isEmail(email)){
            return res.status(401).json({
                success: false,
                message: "provide a valid email"
            })
        }

        // now see if the email entered is registered or not
        const response = await User.findOne({
            where: {
                email: email,
            }
        })
        if(response === null)
            return res.status(401).json({
                success: false,
                message: "user not registered!"
            })
        
        // now that we have found the email, we need to compare the password using bcrypt
        const isValid = await bcrypt.compare(password, response.dataValues.password);
        if(!isValid){
            return res.status(401).json({
                success: false,
                message: "invalid password"
            })
        }

        // now that the email and password are verified, we need to send the access and refresh token in response to the user
        const userData = {
            email: email,
            user_id: response.user_id,
            role: response.role,
            company_id: response.company_id
        }

        const access_token = generateAccessToken(userData);
        const refresh_token = jwt.sign(userData, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '30d'})

        res.status(201).json({
            success: true,
            message: "User successfully logged in!",
            access_token: access_token,
            refresh_token: refresh_token,
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "an error occured while logging in!",
            err
        })
    }
}

exports.refreshToken = async (req, res) => {
    // this function will refresh the access token through the refresh token and send them back to the user
    const refreshToken = req.body.token;
    if(refreshToken === null) 
    return res.status(401).json({
        success: false,
        message: "Refresh token not found!"
    })

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if(err) return res.status(403).json({success: false, message: "Refresh token not valid!"})

        const access_token = generateAccessToken({email: user.email, user_id: user.user_id, role: user.role});
        res.status(201).json({
            success: true, 
            accessToken: access_token,
            refreshToken: refreshToken,
            role: user.role
        })
    })
}

// ----- post related controllers -----
exports.createPost = async (req, res) => {
    // we simply need to extract all the data from req body and create a new post
    const post_id = uuidv4();
    const admin_id = req.admin.user_id;
    const post_content = req.body.post_content;
    const image_url = req.body.image_url;
    const video_url = req.body.video_url;
    const admin = await User.findOne({
        where: {
            user_id: admin_id
        }
    })
    const company_id = admin.dataValues.company_id;

    const postData = {
        post_id: post_id,
        post_creator_id: admin_id,
        post_content: post_content,
        image_urls: image_url,
        video_url: video_url,
        company_id: company_id
    }

    try{
        const response = await Post.create(postData);
        res.status(201).json({
            success: true,
            message: "Post created!",
            response
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not create the post",
            err
        })
    }   
}

exports.getAllPosts = async (req, res) => {
    // simply return all the posts in the database that belong to that company

    try{
        const company_id = req.user.company_id;
        const posts = await Post.findAll({
            where: {
                company_id: company_id
            }
        })
        res.status(201).json({
            success: true,
            message: "fetched all the posts",
            posts,
            company_id
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "error in fetching the posts...",
            err
        })
    }
}

exports.getPost = async (req, res) => {
    // return a certail post by taking the post id from the url as parameter
    try{
        const post_id = req.params.id;
        const post = await Post.findOne({
            where: {
                post_id: post_id
            }
        })
        res.status(201).json({
            success: true,
            message: 'rendering certain post',
            post
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not fetch the requested post",
            err
        })
    }
}

exports.updatePost = async (req, res) => {
    const post_id = req.params.id;
    const admin_id = req.admin.user_id;
    const post_content = req.body.post_content;
    const image_url = req.body.image_url;
    const video_url = req.body.video_url;
    const admin = await User.findOne({
        where: {
            user_id: admin_id
        }
    })
    const company_id = admin.dataValues.company_id;

    const postData = {
        post_id: post_id,
        post_creator_id: admin_id,
        post_content: post_content,
        image_urls: image_url,
        video_url: video_url,
        company_id: company_id
    }

    try{
        const response = await Post.update(postData, {
            where: {
                post_id: post_id
            }
        });
        res.status(201).json({
            success: true,
            message: "Post updated!",
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not update the post",
            err
        })
    } 
}

exports.deletePost = async (req, res) => {
    try{
        const post_id = req.params.id;
        // check if that post even exists?
        const post = await Post.findOne({
            where:{
                post_id: post_id
            }
        })
        if(post === null) return res.status(401).json({
            success: false,
            message: "post does not exist!"
        })

        const response = await Post.destroy({
            where: {
                post_id: post_id
            }
        })
        console.log(response);
        res.status(201).json({
            success: true,
            message: "post deleted successfully!"
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not delete the post!",
            err
        })
    }
}

// ----- likes related controllers -----

exports.likePost = async (req, res) => {
    try{
        const user_id = req.user.user_id;
        const company_id  = req.user.company_id;
        const post_id = req.params.id;
    
        const like_data = {
            creator_id: user_id,
            company_id: company_id,
            post_id: post_id
        }

        // check if the post is already liked by this user
        const likeExist = await Like.findOne({
            where: {
                creator_id: user_id,
                post_id: post_id
            }
        });
        if(likeExist !== null){
            // then dislike the post
            const dislike = await Like.destroy({
                where: {
                    creator_id: user_id,
                    post_id: post_id
                }
            })

            return res.status(201).json({
                success: true,
                message: "successfully disliked the post!"
            })
        }
    
        const newLike = await Like.create(like_data);

        res.status(201).json({
            success: true,
            message: "successfully liked the post"
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not like the post!",
            err
        })
    }
}

exports.likes = async (req, res) => {
    // you just need to return the list of all the likes on that post
    try{
        const post_id = req.params.id;
        const company_id = req.user.company_id;

        // fetch all the likes of this company on this post
        const likeList = await Like.findAll({
            where:{
                company_id: company_id,
                post_id: post_id
            }
        })

        res.status(201).json({
            success: true,
            message: "successfully fetched the list of likes on this post!",
            likeList
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not fetch likes list!",
            err
        })
    }
}

// ----- comments related controllers ----



// ------------------------- handler functions ----------------------------
async function verifyMailHandler(email, user_id){
    try{
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "kartikrai0912@gmail.com",
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const mailOptions = {
            from: 'kartikrai0912@gmail.com',
            to: email,
            subject: "User email verification for NewsLetter",
            html: '<p>Please follow this link to verify your Email! <a href="http://localhost:8000/api/user/verify?id='+user_id+' "> Verify! </a> </p>'
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if(err){
                console.log(err)
            }else{
                console.log("Email has been sent!", info.response)
            }
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "an error occured",
            err
        })
    }
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '3h'})
}




// ---------------------------- middlewares --------------------------------
exports.authenticateUser = async (req, res, next) => {
    // extract the access token from the request header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    if(token === null) return res.status(403).json({success: false, message: "Access token not found!"})
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.status(403).json({success: false, err})

        req.user = user;
        next();
    }) 
}
exports.authenticateAdmin = async (req, res, next) => {
    try{
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
    
        if(token === null) return res.status(401).json({success: false, message: "Access token not found"});

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if(err) return res.status(401).json({success: false, err})
    
            // if(user.role === "user"){
            //     return res.status(401).json({
            //         success: false,
            //         message: "unauthorized access"
            //     })
            // }
    
            req.admin = user;
            next();
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "seems like you don't have access to create a post",
            err
        })
    }
}