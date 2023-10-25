const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Super_admin = sequelize.define('super_admins', {
    super_admin_id: {
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
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profile_picture_url: {
        type: DataTypes.TEXT
    },
    cover_pic_url: {
        type: DataTypes.TEXT
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true
});

// synchronize the model with database
Super_admin.sync({alter: true})
module.exports = Super_admin;