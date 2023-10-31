const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../database/connection');

// create the admin model
const User = sequelize.define('users', {
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    fname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING,
    },
    experience: {
        type: DataTypes.INTEGER
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact: {
        type: DataTypes.STRING
    },
    linkedIn: {
        type: DataTypes.STRING
    },
    profile_pic_url: {
        type: DataTypes.TEXT
    },
    cover_pic_url: {
        type: DataTypes.TEXT
    },
    total_posts: {
        type: DataTypes.INTEGER
    },
    saved_posts: {
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
    blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: "user",
        allowNull: false
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    freezeTableName: true
});

// now that you have defined the model, you need to build and save it using the sync method
User.sync({alter: true});
module.exports = User;