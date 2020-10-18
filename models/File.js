const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const File = sequelize.define('file', {
    uid: DataTypes.UUID,
    mimeType: DataTypes.STRING,
    name: DataTypes.STRING,
    size: DataTypes.INTEGER,
    extFile: DataTypes.STRING
})

module.exports = File