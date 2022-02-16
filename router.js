const Auth = require('./controllers/auth');
const { getSchehdule, makeSchehdule, startCourse, completeCourse, view } = require('./controllers/course')
const passport = require('passport');
require('./services/passport')

const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });

module.exports = function (app) {
  app.get('/', requireAuth, function (req, res) {
    res.send({ message: 'Super secret code is ABC123' });
  });

  /**
   * @api {post} /signin Sign Up
   * @apiName SignIn
   * @apiGroup Authentication
   *
   * @apiParam (body) {String} email Email address.
   * @apiParam (body) {String} password Password.
   *
   * @apiSuccess {String} token API token for authenticated user
   */
  app.post('/signin', requireSignin, Auth.signin);

  /**
  * @api {post} /signup Sign Up
  * @apiName CreateUser
  * @apiGroup Authentication
  *
  * @apiParam (body) {String} email Email address.
  * @apiParam (body) {String} password Password.
  * @apiParam (body) {String} firstName First Name.
  * @apiParam (body) {String} lastName Last Name.
  *
  * @apiSuccess {String} token API token for authenticated user
  */
  app.post('/signup', Auth.signup);

  /**
  * @api {post} /schedule Create Schedule
  * @apiName CreateSchedule
  * @apiGroup Course
  * 
  * @apiHeader  {String} auth token.
  * @apiHeader  [Accept=application/json] application/json.
  *
  * @apiParam (body) {Object[]} courses List of courses.
  *
  * @apiSuccess {String} message Success message
  */
  app.post('/schedule', requireAuth, makeSchehdule)

  /**
  * @api {get} /schedule Get Schedule
  * @apiName GetSchedule
  * @apiGroup Course
  * @apiHeader  {String} auth token.
  * @apiHeader  [Accept=application/json] application/json.
  *
  * @apiSuccess {Object[]} courses List of courses
  */
  app.get('/schedule', requireAuth, getSchehdule)

  /**
  * @api {put} /course/:id/start Start a course
  * @apiName StartCourse
  * @apiGroup Course
  * 
  * @apiHeader  {String} auth token.
  * @apiHeader  [Accept=application/json] application/json.
  * 
  * @apiSuccess {String} message Success Message
  */
  app.put('/course/:id/start', requireAuth, startCourse)

  /**
   * @api {put} /course/:id/complete Complete a course
   * @apiName CompleteCourse
   * @apiGroup Course
   * 
   * @apiHeader  {String} auth token.
   * @apiHeader  [Accept=application/json] application/json.
   * 
   * @apiSuccess {String} message Success Message
   */
  app.put('/course/:id/complete', requireAuth, completeCourse)


  /**
   * @api {get} /course/:id/ View a course
   * @apiName ViewCourse
   * @apiGroup Course
   * 
   * @apiHeader  {String} auth token.
   * @apiHeader  [Accept=application/json] application/json.
   * 
   * @apiSuccess {Object} course Course object
   */
  app.get('/course/:id', requireAuth, view)
}
