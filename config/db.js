const Sequelize = require('sequelize')

const configDb = {
    database: 'testdb',
    username: 'root',
    password: 'password',
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
}

const sequelize = new Sequelize(configDb.database, configDb.username, configDb.password, {

    host: configDb.host,
    dialect: configDb.dialect,
    operatorsAliases: 0,
    logging: false,

    pool: {
        max: configDb.max,
        min: configDb.pool.min,
        acquire: configDb.pool.acquire,
        idle: configDb.pool.idle
    }
})

const db = {}

db.sequelize = sequelize

// db.files = require('../models/File')(sequelize, Sequelize)

module.exports = db