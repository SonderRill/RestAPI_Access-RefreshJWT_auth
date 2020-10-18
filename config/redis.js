var redis = require('redis')

var JWTR = require('jwt-redis').default;
var redisClient = redis.createClient();

module.exports = { JWTR, redisClient }