const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('public'))

console.log('MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [
    {
      description: String,
      duration: Number,
      date: Date
    }
  ]
})

const User = mongoose.model('User', userSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username
    })

    res.json({
      username: user.username,
      _id: user._id
    })

  } catch (err) {
    res.status(400).json({
      error: err.message
    })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, {
      username: 1
    })

    res.json(users)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    const exerciseDate = req.body.date
      ? new Date(req.body.date)
      : new Date()

    const exercise = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date: exerciseDate
    }

    user.log.push(exercise)

    await user.save()

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    })

  } catch (err) {
    res.status(400).json({
      error: err.message
    })
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    let exercises = user.log

    if (req.query.from) {
      const fromDate = new Date(req.query.from)

      exercises = exercises.filter(exercise =>
        exercise.date >= fromDate
      )
    }

    if (req.query.to) {
      const toDate = new Date(req.query.to)

      toDate.setDate(toDate.getDate() + 1)

      exercises = exercises.filter(exercise =>
        exercise.date < toDate
      )
    }

    if (req.query.limit) {
      exercises = exercises.slice(
        0,
        Number(req.query.limit)
      )
    }

    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }))

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log
    })

  } catch (err) {
    res.status(400).json({
      error: err.message
    })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Your app is listening on port ' +
    listener.address().port
  )
})