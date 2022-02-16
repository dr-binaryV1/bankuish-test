const {
  Schedule,
  makeSchedule,
  startCourse,
  completeCourse,
  viewCourse
} = require('../models/course')

module.exports = {
  makeSchehdule: async (req, res, next) => {
    try {
      const { courses } = req.body
      await makeSchedule(courses, req.user.id)

      res.send({ message: 'Schedule successfully created' })
    } catch (err) {
      res.status(400).send({ error: err.message })
    }
  },

  getSchehdule: async (req, res, next) => {
    try {
      const schedule = await Schedule.findAll({
        where: {
          userId: req.user.id
        },
        include: 'Courses'
      })

      res.send({ schedule })
    } catch (err) {
      res.status(400).send({ error: err.message })
    }
  },

  startCourse: async (req, res, next) => {
    try {
      await startCourse(req.params.id, req.user.id)

      res.send({ message: 'Course successfully started' })
    } catch (err) {
      res.status(400).send({ error: err.message })
    }
  },

  completeCourse: async (req, res, next) => {
    try {
      await completeCourse(req.params.id, req.user.id)
      res.send({ message: 'Course successfully completed' })
    } catch (err) {
      res.status(400).send({ error: err.message })
    }
  },

  view: async (req, res, next) => {
    try {
      const userCourse = await viewCourse(req.params.id, req.user.id)
      res.send({ userCourse })
    } catch (err) {
      res.status(400).send({ error: err.message })
    }
  }
}