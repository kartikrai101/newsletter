const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {Company_details, Super_admins} = require('../models')
const nodemailer = require('nodemailer');
require('dotenv').config();

// ------------------------ handler functions ---------------------

async function verifyMailHandler(email, user_id){
    try{
        const transporter = nodemailer.createTransport({
            // host: 'smtp.gmail.com',
            // port: 587,
            // secure: false,
            // requireTLS: true,
            service: 'gmail',
            auth:{
                user: 'kartikrai0912@gmail.com',
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const mailOptions = {
            from: 'kartikrai0912@gmail.com',
            to: email,
            subject: "Email verification for NewsLetter",
            html: '<p>Please follow this link to verify your Email! <a href="http://localhost:8000/api/company/verify?id='+user_id+' "> Verify! </a> </p>'
        }
        transporter.sendMail(mailOptions, (err, info) => {
            if(err){
                console.log(err)
            }else{
                console.log("Email has been sent!", info.response)
            }
        })
    }catch(err){
        console.log(err)
    }
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'});
}




// ---------------------------- middlewares ----------------------------------
exports.authenticateToken = async (req, res, next) => {
    // extract the access token from the req header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) return res.status(403).json({success: false, message: "Access token not found!"})
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.status(403).json({success: false, err})

        req.user = user;
        next();
    }) 
}




// ------------------------ controller functions -----------------------------
exports.companyRegister = async (req, res, next) => {
    const data = req.body;

    const company_id = uuidv4();
    let pass = data.password;
    const generatedPass = await bcrypt.hash(pass, 10);
    const email = data.email_domain

    let domain = "";
    let i = 0;
    while(email[i] !== '@' && i < email.length) i++;
    while(i !== email.length){
        domain += email[i];
        i++;
    }

    if(domain === ""){
        return res.status(401).json({
            success: false,
            message: "invalid email address!"
        })
    }

    const companyData = {
        company_id: company_id,
        company_name: data.company_name,
        email_domain: data.email_domain,
        password: generatedPass,
        domain_access: domain
    }

    const super_admin_id = uuidv4();
    const superAdminData = {
        super_admin_id: super_admin_id,
        fname: data.fname,
        lname: data.lname,
        email: data.email_domain,
        password: generatedPass,
        company_id: company_id
    }

    try{
        const response = await Company_details.create(companyData);
        const response2 = await Super_admins.create(superAdminData);

        // now that the user details are saved, let's do email verification
        await verifyMailHandler(data.email_domain, company_id);
        
        res.status(201).json({
            success: true,
            message: "Company registered!",
            companyData
        })
    }catch(err){
        res.status(402).json({
            success: false,
            message: "Company registration unsuccessfull!",
            err
        })
    }
}

exports.verifyMail = async (req, res) => {
    try{
        //as soon as this page is hit with some user_id, you need to update the
        // 'is_verified' status of that user to true
        const id = req.query.id;

        const updatedInfo = await Company_details.update({is_verified: true},{
            where: {
                company_id: id
            }
        });

        res.status(201).json({
            message: "email verified",
            success: true
        })

    }catch(err){
        console.log(err.message)
    }
}

exports.loginHandler = async (req, res, next) => {
    // verify the email and password
    const {email, password} = req.body;

    try{
        const company = await Company_details.findOne({
            where: {
                email_domain: email
            }
        })

        if(company === null) return res.status(403).json({success: false, message: "Invalid email or password!", company, hashedPassword})
        //console.log(company)

        const isValid = await bcrypt.compare(password, company.password);
        if(!isValid){
            return res.status(401).json({
                success: false,
                message: "Invalid password!"
            })
        }

        // check if the email is verified for that user of not!
        if(company.is_verified === false){
            return res.status(401).json({
                success: false,
                message: "please verify your email first!"
            })
        }

        // find the super_admin_id of that company
        const super_admin = await Super_admins.findOne({
            where: {
                company_id: company.company_id
            }
        })

        const userData = {
            email: email,
            company_id: company.company_id,
            role: "super",
            super_admin_id: super_admin.super_admin_id
        }
        // now that the user is verified, we need to send the jwt token
        const access_token = generateAccessToken(userData);
        const refresh_token = jwt.sign(userData, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '30d'});

        res.status(201).json({
            success: true,
            message: "successfully logged in!",
            tokens: {access_token: access_token, refresh_token: refresh_token}
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "error logging in!",
            err
        })
    }
}

exports.refreshTokenHandler = (req, res) => {
    // this controller function will execute when the access token has expired
    // and we need to create a new access token from this refresh token 
    // and send both back to the user so that the user can now use this new 
    // access token to authenticate themselves
    const refreshToken = req.body.token;

    if(refreshToken === null) 
        return res.status(401).json({
            success: false,
            message: "Refresh token not found!"
        })
    
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, token_data) => {
        if(err) return res.status(403).json({success: false, message: "Refresh token not valid!"})

        //get the original details of the company from database and use them to generate the new access token
        const company_details = await Super_admins.findOne({
            where: {
                company_id: token_data.company_id
            }
        })
        const accessToken = generateAccessToken({
            email: company_details.email, 
            role: company_details.role, 
            company_id: company_details.company_id,
            super_admin_id: company_details.super_admin_id
        })

        res.status(201).json({
            success: true, 
            accessToken: accessToken,
            refreshToken: refreshToken
        })
    })
}

exports.getCompanies = async (req, res) => {
    try{
        const list = await Company_details.findAll();
        res.status(201).json({
            success: true,
            list
        })
    }catch(err){
        res.json({
            success: false,
            message: "Could not fetch companies list",
            err
        })
    }
}