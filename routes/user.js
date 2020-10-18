const router = require('express').Router()
const bcrypt = require('bcryptjs')

const { JWTR, redisClient } = require('../config/redis')
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const secret = require('../config/default.json')
const auth = require('../middlewares/auth')

const jwtr = new JWTR(redisClient)

// регистрация
router.post('/signup',
  [
    check('email', 'Email некорректен').isEmail().not().isEmpty(),
    check('password', 'Введите пароль минимум в 6 символов').isLength({ min: 6 })
  ],
  async (req, res) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body

    try {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt)

      const payload = {
        user: {
          id: email
        }
      }

      const user = await User.findOrCreate({ where: { id: email }, defaults: { id: email, password: hashPassword } })

      if (!user[1]) {
        return res.status(400).json({ errors: [{ msg: 'Аккаунт с таким email уже существует' }] })
      }

      const refreshToken = await jwtr.sign(payload, secret.refreshTokenSecret)
      await user[0].createRefreshToken({
        token: refreshToken
      })

      const accessToken = await jwtr.sign(payload, secret.jwtSecret, {
        expiresIn: 600
      })
      res.cookie('refreshToken', refreshToken, { httpOnly: true, overwrite: true }).status(201).json({ accessToken, refreshToken })

    } catch (err) {
      console.log(err);
      res.status(500).send('Server error')
    }
  }
)

// вход
router.post('/signin',
  [
    check('email', 'Введите Email').isEmail(),
    check('password', 'Введите пароль').exists()
  ], async (req, res) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body

    try {
      const user = await User.findByPk(email)
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Неверные учетные данные' }] })
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Неверные учетные данные' }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      }
      const refreshToken = await jwtr.sign(payload, secret.refreshTokenSecret)

      // создаем новый рефреш либо обновляем старый
      const updateOrCreateRefreshToken = async (model, where, newItem) => {

        const foundItem = await model.findOne({ where })
        if (!foundItem) {
          const item = await user.createRefreshToken(newItem)
          return { item, created: true }
        }
        const item = await model.update(newItem, { where })

        return { item, created: false }
      }

      await updateOrCreateRefreshToken(RefreshToken, { userId: user.id }, { token: refreshToken })

      const accessToken = await jwtr.sign(payload, secret.jwtSecret, {
        expiresIn: 600
      })

      // можно установить path для роутов авторизации, чтобы кука не гуляла по всем роутам
      res.cookie('refreshToken', refreshToken, { httpOnly: true, overwrite: true }).json({ accessToken })

    } catch (err) {
      console.log(err);
      res.status(500).send('Server error')
    }
  }
)

// обновление access токена
router.post('/signin/new_token', async (req, res) => {
  try {
    const refresh = req.body.token || req.cookies.refreshToken

    if (!refresh) {
      return res.status(401).json({ msg: 'Токен не передан' })
    }

    // проверка на наличие токена в базе
    const token = await RefreshToken.findOne({ where: { token: refresh } })
    if (!token) {
      return res.status(403).json({ msg: 'Не верный refresh токен' })
    }

    const { user } = await jwtr.verify(token.token, secret.refreshTokenSecret)
    const payload = {
      user: {
        id: user.id
      }
    }

    // обновляем refresh в базе
    const newRefresh = await jwtr.sign(payload, secret.refreshTokenSecret)
    await RefreshToken.update({
      token: newRefresh
    }, { where: { token: refresh } })

    // выдаем новый accesss и устанавливаем новый refresh в куки
    const accessToken = await jwtr.sign(payload, secret.jwtSecret, { expiresIn: 600 })
    res.cookie('refreshToken', newRefresh, { httpOnly: true, overwrite: true }).json({ accessToken })

  } catch (err) {
    console.log(err)
    res.status(500).send('Server error')
  }
})

// выход из системы
router.get('/logout', auth, async (req, res) => {
  try {

    await RefreshToken.destroy({ where: { userId: req.user.id } })

    // делаем access токен не действительным
    await jwtr.destroy(req.jti, secret.jwtSecret)

    res.clearCookie('refreshToken').json({ msg: 'Вы вышли. Токены уничтожены' })

  } catch (e) {
    console.log(e)
  }

})

// инфромация о юзере
router.get('/info', auth, (req, res) => {
  res.json({ userId: req.user.id })
})

module.exports = router