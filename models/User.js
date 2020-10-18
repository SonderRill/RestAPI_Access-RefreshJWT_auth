const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const File = require('./File')
const RefreshToken = require('./RefreshToken')


const User = sequelize.define('user', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

User.hasMany(File)
User.hasMany(RefreshToken)

module.exports = User