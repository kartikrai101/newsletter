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
const Comment = require('../models/commentModel');



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

        // check if the user's email is verified or not
        if(response.is_verified === false){
            return res.status(401).json({
                success: false,
                message: "please verify your email first!"
            })
        }

        // now that the email and password are verified, we need to send the access and refresh token in response to the user
        const userData = {
            email: email,
            user_id: response.user_id,
            role: response.role,
            company_id: response.company_id
        }

        const access_token = await generateAccessToken(userData);
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

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, token_data) => {
        if(err) return res.status(403).json({success: false, message: "Refresh token not valid!", err})

        const user_data = await User.findOne({
            where: {
                user_id: token_data.user_id
            }
        })

        const access_token = generateAccessToken({email: user_data.email, user_id: user_data.user_id, role: user_data.role});

        res.status(201).json({
            success: true, 
            accessToken: access_token,
            refreshToken: refreshToken,
        })
    })
}

exports.getUser = async (req, res) => {
    try{
        // simply return the user details of the user that is being called for
        
        const user_id = req.params.id;
        const user = await User.findOne({
            where: {
                user_id: user_id
            }
        })
        if(user === null) return res.status(401).json({
            success: false,
            message: "user does not exist!"
        })

        res.status(201).json({
            success: true,
            message: "successfully fetched the user!",
            user: user
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not get the user!",
            err
        })
    }
}

exports.updateProfile = async (req, res) => {
    try{
        // check if the user who is trying to update the profile is the actual 
        // creator of that profile
        const owner_id = req.user.user_id;
        const user_id = req.params.id;

        if(owner_id !== user_id) return res.status(401).json({
            success: false,
            message: "unauthorized access!"
        })

        const {fname, lname, position, experience, 
            contact, linkedIn, profile_pic_url, 
            cover_pic_url, description} = req.body;

        const updatedUser = await User.update({
            fname, lname, position, experience, 
            contact, linkedIn, profile_pic_url, 
            cover_pic_url, description
        }, {
            where: {
                user_id: user_id
            }
        })

        res.status(201).json({
            success: true,
            message: "successfully updated the user profile!",
            updatedUser
        })
        
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not update the profile",
            err
        })
    }
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
    // first of all we need to check if this admin has created this post or not
    const postDetail = await Post.findOne({
        where: {
            post_id: post_id
        }
    })
    if(postDetail.post_creator_id !== admin_id)
    return res.status(401).json({
        success: false,
        message: "unauthorized access!"
    })


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
        const admin_id = req.admin.user_id;

        // check if that post even exists
        const post = await Post.findOne({
            where:{
                post_id: post_id
            }
        })
        if(post === null) return res.status(401).json({
            success: false,
            message: "post does not exist!"
        })

        if(post.post_creator_id !== admin_id)
        return res.status(401).json({
            success: false,
            message: "unauthorized access!"
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

exports.savePost = async (req, res) => {
    try{
        const user_id = req.user.user_id;
        const post_id = req.params.id;

        const user = await User.findOne({
            where: {
                user_id: user_id
            }
        })

        // check if this post is already saved
        for(let post of user.saved_posts){
            if(post === post_id)
            return res.status(401).json({
                success: false,
                message: "post already saved!"
            })
        }

        let savedPosts = [];

        if(user.saved_posts === null){
            savedPosts = [post_id]
        }else{
            savedPosts = [...user.saved_posts, post_id]
        }

        // const savedPosts = [...user.saved_posts, post_id];


        const response = await User.update({saved_posts: savedPosts}, {
            where: {
                user_id: user_id
            }
        })

        res.status(201).json({
            success: true,
            message: "post saved successfully!",
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not save this post!",
            err
        })
    }
}

exports.unsavePost = async (req, res) => {
    try{
        const user_id = req.user.user_id;
        const post_id = req.params.id;

        // check if this post is saved or not?
        const user = await User.findOne({
            where: {
                user_id: user_id
            }
        })

        let savedPosts = user.saved_posts;


        for (let i = 0; i < savedPosts.length; i++) {
            if (savedPosts[i] === post_id) {
                let spliced = savedPosts.splice(i, 1);

                const updated = User.update({saved_posts: savedPosts}, {
                    where: {
                        user_id: user_id
                    }
                })

                return res.status(201).json({
                    success: true,
                    message: "post unsaved successfully!"
                })
            }
        }

        res.status(401).json({
            success: false,
            message: "post not saved!"
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not unsave the post!",
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
exports.createComment = async (req, res) => {
    try{
        // extract all the comment related details and create a new comment
        const comment_creator_id = req.user.user_id;
        const post_id = req.params.id;
        const comment_content = req.body.comment_content;
        const company_id = req.user.company_id;
        const comment_id = uuidv4();

        const newComment = await Comment.create({
            comment_id, company_id, comment_content, post_id, comment_creator_id
        })

        res.status(201).json({
            success: true,
            message: "successfully commented on the post!",
            newComment
        })
        
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not create the comment!",
            err
        })
    }
}

exports.getComments = async (req, res) => {
    try{
        // you just need to fetch all the comments on this post
        const post_id = req.params.id;
        const company_id = req.user.company_id;

        const comments = await Comment.findAll({
            where:{
                post_id: post_id,
                company_id: company_id
            }
        })

        res.status(201).json({
            success: true,
            message: "successfully fetched all the comments on this post",
            comments
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not fetch all comments!",
            err
        })
    }
}

exports.updateComment = async (req, res) => {
    // first of all we need to check if this comment is being updated by the creator only
    try{
        const comment_id = req.params.commentId;
        const user_id = req.user.user_id;
        const comment_content = req.body.comment_content;

        const ogComment = await Comment.findOne({
            where: {
                comment_id: comment_id
            }
        })
        const creator_id = ogComment.comment_creator_id;
        if(creator_id !== user_id) return res.status(401).json({
            success: false,
            message: "unauthorized access!"
        })

        const updatedComment = await Comment.update({comment_content: comment_content}, {
            where: {
                comment_id: comment_id
            }
        })
        res.status(201).json({
            success: true,
            message: "comment updated successfully!",
            updatedComment
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not update the comment!",
            err
        })
    }
}

exports.deleteComment = async (req, res) => {
    try{
        // first of all we need to check if the user is authorized to delete it or not!
        const comment_id = req.params.commentId;
        const user_id = req.user.user_id;

        const ogComment = await Comment.findOne({
            where: {
                comment_id: comment_id
            }
        })
        const creator_id = ogComment.comment_creator_id;
        if(creator_id !== user_id) return res.status(401).json({
            success: false,
            message: "unauthorized access!"
        })

        const response = await Comment.destroy({
            where: {
                comment_id: comment_id
            }
        })

        res.status(201).json({
            success: false,
            message: "successfully deleted the comment!"
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not delete the comment",
            err
        })
    }
}









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

async function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
}




// ---------------------------- middlewares --------------------------------
exports.authenticateUser = async (req, res, next) => {
    // extract the access token from the request header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    if(token === null) return res.status(403).json({success: false, message: "Access token not found!"})

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){ return res.status(403).json({success: false, err})}
        
        req.user = user;
        next();
    }) 
}
exports.authenticateAdmin = async (req, res, next) => {
    try{
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];
    
        if(token === null) return res.status(401).json({success: false, message: "Access token not found"});

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, token_data) => {
            if(err) return res.status(401).json({success: false, err})
    
            if(token_data.role !== "admin"){
                return res.status(401).json({
                    success: false,
                    message: "unauthorized access"
                })
            }
    
            req.admin = token_data;
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