const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../database/connection')

// defining the employee model
const Employee = sequelize.define('Employee', {
    employee_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        primaryKey: true
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
})

Employee.sync({alter: true})
module.exports = Employee;