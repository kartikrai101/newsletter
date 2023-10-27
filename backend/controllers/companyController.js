const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {Company_details} = require('../models')
const nodemailer = require('nodemailer');
require('dotenv').config();

// ------------------------ functions ---------------------

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
                pass: 'llyh nayk cggx wwbw'
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
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15s'});
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
    while(email[i] !== '@') i++;
    while(i !== email.length){
        domain += email[i];
        i++;
    }

    const companyData = {
        company_id: company_id,
        company_name: data.company_name,
        email_domain: data.email_domain,
        password: generatedPass,
        domain_access: domain
    }

    try{
        const response = await Company_details.create(companyData);

        // now that the user details are saved, let's do email verification
        verifyMailHandler(data.email_domain, company_id);
        
        res.status(201).json({
            success: true,
            companyData
        })
    }catch(err){
        res.status(402).json({
            success: false,
            error: err
        })
    }
}

exports.verifyMail = async (req, res, next) => {
    try{
        //as soon as this page is hit with some user_id, you need to update the
        // 'is_verified' status of that user to true
        const id = req.query.id;
        console.log(id);

        const updatedInfo = await Company_details.update({is_verified: true},{
            where: {
                company_id: id
            }
        });

        //console.log(updatedInfo);
        res.status(201).json({
            message: "email verified",
            success: true
        })

    }catch(err){
        console.log(err.message)
    }
}

exports.loginSuperAdmin = async (req, res, next) => {
    // verify the email and password
    const {email, password} = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    try{
        let user = Company_details.findAll({
            where: {
                email_domain: email,
                password: hashedPassword
            }
        })

        const userData = {
            email: email,
            userId: user.company_id
        }
        // now that the user is verified, we need to send the jwt token
        const access_token = generateAccessToken(userData);
        const refresh_token = jwt.sign(userData, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1h'});

        res.status(201).json({
            success: true,
            tokens: {access_token: access_token, refresh_token: refresh_token}
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: err
        })
    }
}