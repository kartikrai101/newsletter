const {Sequelize, DataTypes} = require('sequelize')
const sequelize = require('../database/connection')

// define the post model
const Post = sequelize.define('posts', {
    post_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        primaryKey: true
    },
    post_creator_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    post_content: {
        type: DataTypes.TEXT,
    },
    image_urls: {
        type: DataTypes.ARRAY(DataTypes.TEXT)
    },
    video_url: {
        type: DataTypes.TEXT
    },
    company_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true
})

Post.sync({force: true})
module.exports = Post;