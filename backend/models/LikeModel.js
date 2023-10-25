const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../database/connection')

const Like = sequelize.define('likes', {
    creator_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    post_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true
})

Like.sync({alter: true})
module.exports = Like;