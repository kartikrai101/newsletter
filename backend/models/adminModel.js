const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../database/connection');

// create the admin model
const Admin = sequelize.define('Admin', {
    admin_id: {
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
        allowNull: false
    },
    experience: {
        type: DataTypes.INTEGER
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
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
        type: DataTypes.BOOLEAN
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true
});

// now that you have defined the model, you need to build and save it using the sync method
Admin.sync({alter: true});
module.exports = Admin;