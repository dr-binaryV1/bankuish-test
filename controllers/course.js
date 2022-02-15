const toposort = require('toposort')
const { UserCourse, Schedule, Course, statusMapping } = require('../models/course')

module.exports = {
  makeSchehdule: async (req, res, next) => {
    try {
      const { courses } = req.body
      const existingSchedule = await Schedule.findOne({
        where: {
          userId: req.user.id,
          status: statusMapping.STARTED
        },
        attributes: ['id']
      })

      if (!existingSchedule) {
        const graph = courses.map(course => {
          return [course.desiredCourse, course.requiredCourse]
        })

        const sortedCourses = toposort(graph).reverse()

        const schedule = await Schedule.create({
          userId: req.user.id,
          status: statusMapping.STARTED
        })

        for (let i = 0; i < sortedCourses.length; i++) {
          const currentCourse = courses.find(c => c.desiredCourse === sortedCourses[i])
          let course
          if (!currentCourse) {
            [firstCourse, created] = await Course.findOrCreate({
              where: {
                name: sortedCourses[i]
              }
            })

            course = firstCourse
          } else {
            const [preCourse] = await Course.findOrCreate({
              where: {
                name: currentCourse.requiredCourse
              }
            })

            let [desiredCourse] = await Course.findOrCreate({
              where: {
                name: currentCourse.desiredCourse,
                preCourse: preCourse.id
              }
            })

            course = desiredCourse
          }

          await UserCourse.create({
            userId: req.user.id,
            courseId: course.id,
            scheduleId: schedule.id,
            status: statusMapping.NOT_STARTED,
            order: i
          })
        }

        res.send({ message: 'Schedule successfully created' })
      } else {
        res.status(403).send({ message: 'Cannot have start an new schedule until the current one is completed' })
      }
    } catch (err) {
      return next(err)
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
      return next(err)
    }
  },

  startCourse: async (req, res, next) => {
    try {
      const userCourse = await UserCourse.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: Course,
        raw: true
      })

      if (!userCourse) return res.status(404).send({ message: 'Course not found' })
      if (userCourse.status === statusMapping.STARTED) return res.status(200).send({ message: 'Course already started' })
      if (userCourse.status === statusMapping.COMPLETED) return res.status(400).send({ message: 'Course already completed' })

      const startedCourses = await UserCourse.findAll({
        where: {
          userId: req.user.id,
          status: statusMapping.STARTED
        },
        raw: true
      })

      if (startedCourses.length > 0) return res.status(403).send({ message: 'You can only have one course started.' })

      if (!userCourse['course.preCourse']) {
        await UserCourse.update(
          { status: statusMapping.STARTED },
          { where: { userId: req.user.id, id: req.params.id } },
        )
      } else {
        const preCourse = await UserCourse.findOne({
          where: {
            courseId: userCourse['course.preCourse'],
            userId: req.user.id
          },
          include: Course,
          raw: true
        })

        console.log(preCourse)

        if (preCourse.status !== statusMapping.COMPLETED) {
          return res.status(403).send({ message: `Required course not yet completed. Please complete "${preCourse['course.name']}" before starting this course` })
        } else {
          await UserCourse.update(
            { status: statusMapping.STARTED },
            { where: { userId: req.user.id, id: req.params.id } },
          )
        }
      }

      res.send({ message: 'Course successfully started' })
    } catch (err) {
      return next(err)
    }
  },

  completeCourse: async (req, res, next) => {
    try {
      const userCourse = await UserCourse.findOne({
        where: {
          userId: req.user.id,
          id: req.params.id
        }
      })

      if (!userCourse) return res.status(404).send({ message: 'Course not found' })

      if (userCourse.status !== statusMapping.STARTED) {
        if (userCourse.status === statusMapping.COMPLETED) {
          return res.status(403).send({ message: 'Course already completed' })
        } else if (userCourse.status === statusMapping.NOT_STARTED) {
          return res.status(403).send({ message: 'Course not started' })
        }
      } else {
        await UserCourse.update(
          { status: statusMapping.COMPLETED },
          { where: { userId: req.user.id, id: req.params.id } },
        )

        res.send({ message: 'Course successfully completed' })
      }
    } catch (err) {
      return next(err)
    }
  },

  view: async (req, res, next) => {
    try {
      const userCourse = await UserCourse.findOne({
        where: {
          userId: req.user.id,
          id: req.params.id
        },
        include: Course,
        raw: true
      })

      if (userCourse['course.preCourse']) {
        const preCourse = await UserCourse.findOne({
          where: {
            userId: req.user.id,
            courseId: userCourse['course.preCourse']
          },
          include: Course,
          raw: true
        })

        if (preCourse.status !== statusMapping.COMPLETED) {
          return res.status(403).send({ message: `Unable to view course. Please complete required course "${preCourse['course.name']}"` })
        }
      }
      res.send({ userCourse })
    } catch (err) {
      return next(err)
    }
  }
}