const User = require('../models/user')
const {
  makeSchedule,
  startCourse,
  completeCourse,
  Schedule,
  UserCourse,
  Course,
  viewCourse
} = require('../models/course')

describe('Course Test', () => {
  let user
  const courses = [
    {
      "desiredCourse": "PortfolioConstruction",
      "requiredCourse": "PortfolioTheories"
    },
    {
      "desiredCourse": "InvestmentManagement",
      "requiredCourse": "Investment"
    },
    {
      "desiredCourse": "Investment",
      "requiredCourse": "Finance"
    },
    {
      "desiredCourse": "PortfolioTheories",
      "requiredCourse": "Investment"
    },
    {
      "desiredCourse": "InvestmentStyle",
      "requiredCourse": "InvestmentManagement"
    }
  ]

  beforeEach(async () => {
    user = await User.create({
      firstName: 'Test',
      lastName: 'Test',
      email: 'test@test.com',
      password: 'password'
    })
  });

  afterEach(async () => {
    await UserCourse.destroy({
      where: { userId: user.dataValues.id }
    })
    await Schedule.destroy({ where: { userId: user.dataValues.id } })
    await User.destroy({ where: { id: user.dataValues.id } })
  });

  test('should be able to create a schedule if none is currently started', async () => {
    await makeSchedule(courses, user.dataValues.id)
    const userCourses = await UserCourse.findAll({
      where: {
        userId: user.dataValues.id
      },
      include: Course,
      raw: true
    })

    expect(userCourses[0]['course.name'] === 'Finance').toBeTruthy()
    expect(userCourses[1]['course.name'] === 'Investment').toBeTruthy()
    expect(userCourses[2]['course.name'] === 'InvestmentManagement').toBeTruthy()
    expect(userCourses[3]['course.name'] === 'InvestmentStyle').toBeTruthy()
    expect(userCourses[4]['course.name'] === 'PortfolioTheories').toBeTruthy()
    expect(userCourses[5]['course.name'] === 'PortfolioConstruction').toBeTruthy()
  })

  test('Should be able to start a course', async () => {
    await makeSchedule(courses, user.dataValues.id)
    const userCourses = await UserCourse.findAll({
      where: {
        userId: user.dataValues.id
      },
      include: Course,
      raw: true
    })

    await startCourse(userCourses[0].id, user.dataValues.id)

    const course = await UserCourse.findOne({
      where: {
        id: userCourses[0].id,
      },
      raw: true
    })

    expect(course.status).toEqual('started')
  })

  test('Should not be able to start course before completing required course', async () => {
    await makeSchedule(courses, user.dataValues.id)
    const userCourses = await UserCourse.findAll({
      where: {
        userId: user.dataValues.id
      },
      include: Course,
      raw: true
    })

    await startCourse(userCourses[3].id, user.dataValues.id)
      .catch(e =>
        expect(e.message).toEqual('Please complete required course first')
      )
  })

  test('Should not be able to complete course before starting', async () => {
    await makeSchedule(courses, user.dataValues.id)
    const userCourses = await UserCourse.findAll({
      where: {
        userId: user.dataValues.id
      },
      include: Course,
      raw: true
    })

    await completeCourse(userCourses[0].id, user.dataValues.id)
      .catch(e =>
        expect(e.message).toEqual('Course not started')
      )
  })

  test('User should only be able to take one course at a time ', async () => {
    await makeSchedule(courses, user.dataValues.id)
    const userCourses = await UserCourse.findAll({
      where: {
        userId: user.dataValues.id
      },
      include: Course,
      raw: true
    })

    await startCourse(userCourses[0].id, user.dataValues.id)

    await startCourse(userCourses[1].id, user.dataValues.id)
      .catch(e =>
        expect(e.message).toEqual('You can only have one course in progress')
      )
  })

  test('User should not be able to view course with required course unless required course is completed', async () => {
    await makeSchedule(courses, user.dataValues.id)
    const userCourses = await UserCourse.findAll({
      where: {
        userId: user.dataValues.id
      },
      include: Course,
      raw: true
    })

    await startCourse(userCourses[0].id, user.dataValues.id)

    await viewCourse(userCourses[1].id, user.dataValues.id)
      .catch(e =>
        expect(e.message).toEqual('Please complete required course first')
      )

    await completeCourse(userCourses[0].id, user.dataValues.id)
    const course = await viewCourse(userCourses[1].id, user.dataValues.id)
    expect(course['course.name']).toEqual('Investment')
  })
})