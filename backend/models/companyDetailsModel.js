const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

// now that we have imported the instance of Sequelize, we can start building our model
const Company_details = sequelize.define('company_details', {
    company_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    address: {
        type: DataTypes.STRING(500),
    },
    linkedin_url: {
        type: DataTypes.TEXT,
        unique: true
    },
    website_url: {
        type: DataTypes.TEXT,
        unique: true
    },
    email_domain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email_domain2: {
        type: DataTypes.STRING,
        unique: true
    },
    contact1: {
        type: DataTypes.STRING(20)
    },
    contact2: {
        type: DataTypes.STRING(20)
    },
    cover_image_url: {
        type: DataTypes.TEXT
    },
    company_image: {
        type: DataTypes.TEXT
    },
    domain_access: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    freezeTableName: true
});

Company_details.sync({alter: true});

module.exports = Company_details;

