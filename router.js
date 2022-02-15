const Auth = require('./controllers/auth');
const { getSchehdule, makeSchehdule, startCourse, completeCourse, view } = require('./controllers/course')
const passport = require('passport');
require('./services/passport')

const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });

module.exports = function (app) {
    app.get('/', requireAuth, function(req, res) {
        res.send({ message: 'Super secret code is ABC123'});
    });

    app.post('/signin', requireSignin, Auth.signin);

    app.post('/signup', Auth.signup);

    app.post('/schedule', requireAuth, makeSchehdule)

    app.get('/schedule', requireAuth, getSchehdule)

    app.put('/course/:id/start', requireAuth, startCourse)

    app.put('/course/:id/complete', requireAuth, completeCourse)

    app.get('/course/:id', requireAuth, view)
}
