const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../database/connection');

const Comment = sequelize.define('comments', {
    comment_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        primaryKey: true
    },
    comment_creator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    comment_content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    post_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true
})

Comment.sync({alter: true})
module.exports = Comment;