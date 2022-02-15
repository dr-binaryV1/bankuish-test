const db = require('./index')
const { Sequelize } = db
const User = require('./user')

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
    values: ['not started', 'started', 'completed']
  }
}, {
  freezeTableName: true
})

const Schedule = db.sequelize.define('schedule', {
  status: {
    type: Sequelize.ENUM,
    values: ['started', 'completed']
  }
}, {
  freezeTableName: true
})

UserCourse.belongsTo(Schedule)
UserCourse.belongsTo(Course)
UserCourse.belongsTo(User)
Schedule.belongsTo(User)
Schedule.hasMany(UserCourse, { as: 'Courses' })

Course.sync()
UserCourse.sync()
Schedule.sync()

module.exports = {
  UserCourse,
  Schedule,
  Course
};