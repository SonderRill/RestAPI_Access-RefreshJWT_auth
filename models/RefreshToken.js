const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const RefreshToken = sequelize.define('refreshToken', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

module.exports = RefreshToken