const express = require('express')
const app = express()
const db = require('./config/db')
const cookieParser = require('cookie-parser')
const cors = require('cors')

async function startDb() {
    try {
        await db.sequelize.sync()
        console.log('Drop and Resync with { force: true }');
    } catch (err) {
        console.log(err)
    }
}
startDb()

app.use(cors())
app.use(cookieParser())
app.use(express.json())

app.use('/', require('./routes/user'))
app.use('/file', require('./routes/files'))


const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Server has been started on ${PORT} port`))