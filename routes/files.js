const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const upload = require('../middlewares/multer')
const auth = require('../middlewares/auth')
const File = require('../models/File')
const User = require('../models/User')

const unlinkAsync = promisify(fs.unlink)

// cоздание документа
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
    try {

        const extFile = req.file.originalname.split('.').pop()

        const user = await User.findByPk(req.user.id)

        const file = await user.createFile({
            mimeType: req.file.mimetype,
            name: req.file.originalname,
            uid: req.file.filename,
            size: req.file.size,
            extFile
        })

        res.status(201).json(file)
    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

// пагинация
router.get('/list', auth, async (req, res) => {
    try {

        let { page, list_size } = req.query

        function isValidParam(value) {
            return (value instanceof Number || typeof value === 'number') && !isNaN(value) && Number.isInteger(value)
        }

        const getPagination = (page = 0, list_size = 10) => {

            if (!isValidParam(+page) || !isValidParam(+list_size)) {
                return res.status(400).json({ msg: 'Недопустимые значения параметров' })
            }

            return {
                limit: list_size < 1 ? 10 : +list_size,
                offset: page <= 1 ? 0 : (page - 1) * list_size
            }
        }

        const { limit, offset } = getPagination(page, list_size)
        const data = await File.findAndCountAll({ limit, offset })

        res.json(data)

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

// получениe информации о документе по id
router.get('/:id', auth, async (req, res) => {
    const id = req.params.id
    try {

        const fileInfo = await File.findOne({ where: { id } })
        if (!fileInfo) {
            return res.status(404).json({ msg: 'Информации о файле нет' })
        }
        res.json(fileInfo)

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})

// скачивание файла
router.get('/download/:id', auth, async (req, res) => {
    const id = req.params.id
    try {

        const fileInfo = await File.findByPk(id)

        if (!fileInfo) {
            return res.status(404).json({ msg: 'Файл не найден' })
        }

        res.download(path.join(process.cwd(), 'uploads', fileInfo.uid), fileInfo.name)

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})


// обновление документа
router.put('/update/:id', auth, upload.single('file'), async (req, res) => {
    const id = req.params.id
    const extFile = req.file.originalname.split('.').pop()

    try {

        const fileInfo = await File.findByPk(id)

        if (!fileInfo) {
            return res.status(404).json({ msg: 'Файл не найден' })
        }

        await unlinkAsync(path.join(process.cwd(), 'uploads', fileInfo.uid))
        await File.update({
            uid: req.file.filename,
            mimeType: req.file.mimetype,
            name: req.file.originalname,
            size: req.file.size,
            extFile
        }, { where: { id } })

        res.json({ msg: 'Документ обновлен' })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
});


// удаление документа
router.delete('/delete/:id', auth, async (req, res) => {
    const id = req.params.id

    try {
        const fileInfo = await File.findByPk(id)

        if (!fileInfo) {
            return res.status(404).json({ msg: 'Файл не найден' })
        }

        await unlinkAsync(path.join(process.cwd(), 'uploads', fileInfo.uid))
        await File.destroy({ where: { id } })
        res.json({ msg: 'Документ удален' })

    } catch (err) {
        console.log(err)
        res.status(500).send('Server error')
    }
})


module.exports = router