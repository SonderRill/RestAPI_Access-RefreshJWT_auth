const { JWTR, redisClient } = require('../config/redis')
var jwtr = new JWTR(redisClient)

const secret = require('../config/default.json')

module.exports = async (req, res, next) => {
    const token = req.header('x-auth-token')

    if (!token) {
        return res.status(401).json({ msg: 'Токен не передан' })
    }

    try {

        const decoded = await jwtr.verify(token.split(' ')[1], secret.jwtSecret)
        req.user = decoded.user
        req.jti = decoded.jti
        next()

    } catch (err) {

        if (err.message == 'jwt expired' || 'TokenDestroyedError') {
            return res.status(403).json({ msg: 'Вы не авторизованы' });
        }

        res.status(500).send('Server error')
        console.log(err)
    }

}
