const db = require('./index')
const toposort = require('toposort')
const { Sequelize } = db
const User = require('./user')
const statusMapping = {
  NOT_STARTED: 'not started',
  STARTED: 'started',
  COMPLETED: 'completed'
}

const errorMapping = {
  courseNotFound: 'Course not found',
  courseAlreadyStarted: 'Course already started',
  courseAlreadyCompleted: 'Course already completed',
  tooManyCourse: 'You can only have one course in progress',
  preCourseNotDone: 'Please complete required course first',
  incompleteSchedule: 'Cannot have start an new schedule until the current one is completed',
  courseNotStarted: 'Course not started'
}

const Course = db.sequelize.define('course', {
  name: {
    type: Sequelize.STRING
  },
  preCourse: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true
})

const UserCourse = db.sequelize.define('userCourse', {
  courseId: {
    type: Sequelize.INTEGER
  },
  scheduleId: {
    type: Sequelize.INTEGER
  },
  order: {
    type: Sequelize.INTEGER
  },
  status: {
    type: Sequelize.ENUM,
    values: [statusMapping.NOT_STARTED, statusMapping.STARTED, statusMapping.COMPLETED]
  }
}, {
  freezeTableName: true
})

const Schedule = db.sequelize.define('schedule', {
  status: {
    type: Sequelize.ENUM,
    values: [statusMapping.STARTED, statusMapping.COMPLETED]
  }
}, {
  freezeTableName: true
})

async function makeSchedule(courses, userId) {
  const existingSchedule = await Schedule.findOne({
    where: {
      userId,
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
      userId: userId,
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
        userId: userId,
        courseId: course.id,
        scheduleId: schedule.id,
        status: statusMapping.NOT_STARTED,
        order: i
      })
    }
  } else {
    throw new Error(errorMapping.incompleteSchedule)
  }
}

async function startCourse(courseId, userId) {
  const userCourse = await UserCourse.findOne({
    where: {
      id: courseId,
      userId
    },
    include: Course,
    raw: true
  })

  if (!userCourse) throw new Error(errorMapping.courseNotFound)
  if (userCourse.status === statusMapping.STARTED) throw new Error(errorMapping.courseAlreadyStarted)
  if (userCourse.status === statusMapping.COMPLETED) throw new Error(errorMapping.courseAlreadyCompleted)

  const startedCourses = await UserCourse.findAll({
    where: {
      userId,
      status: statusMapping.STARTED
    },
    raw: true
  })

  if (startedCourses.length > 0) throw new Error(errorMapping.tooManyCourse)

  if (!userCourse['course.preCourse']) {
    await UserCourse.update(
      { status: statusMapping.STARTED },
      { where: { userId, id: courseId } },
    )
  } else {
    const preCourse = await UserCourse.findOne({
      where: {
        courseId: userCourse['course.preCourse'],
        userId
      },
      include: Course,
      raw: true
    })

    if (preCourse.status !== statusMapping.COMPLETED) {
      throw new Error(errorMapping.preCourseNotDone)
    } else {
      await UserCourse.update(
        { status: statusMapping.STARTED },
        { where: { userId, id: courseId } },
      )
    }
  }
}

async function completeCourse(courseId, userId) {
  const userCourse = await UserCourse.findOne({
    where: {
      userId,
      id: courseId
    }
  })

  if (!userCourse) throw new Error(errorMapping.courseNotFound)

  if (userCourse.status !== statusMapping.STARTED) {
    if (userCourse.status === statusMapping.COMPLETED) {
      throw new Error(errorMapping.courseAlreadyCompleted)
    } else if (userCourse.status === statusMapping.NOT_STARTED) {
      throw new Error(errorMapping.courseNotStarted)
    }
  } else {
    await UserCourse.update(
      { status: statusMapping.COMPLETED },
      { where: { userId, id: courseId } }
    )
  }
}

async function viewCourse(courseId, userId) {
  const userCourse = await UserCourse.findOne({
    where: {
      userId,
      id: courseId
    },
    include: Course,
    raw: true
  })

  if (!userCourse) throw new Error(errorMapping.courseNotFound)
  if (userCourse['course.preCourse']) {
    const preCourse = await UserCourse.findOne({
      where: {
        userId,
        courseId: userCourse['course.preCourse']
      },
      include: Course,
      raw: true
    })

    if (preCourse.status !== statusMapping.COMPLETED) {
      throw new Error(errorMapping.preCourseNotDone)
    }
  }

  return userCourse
}

UserCourse.belongsTo(Schedule)
UserCourse.belongsTo(Course)
UserCourse.belongsTo(User)
Schedule.belongsTo(User)
Schedule.hasMany(UserCourse, { as: 'Courses' })

module.exports = {
  Schedule,
  statusMapping,
  makeSchedule,
  startCourse,
  completeCourse,
  viewCourse,
  UserCourse,
  Course
};