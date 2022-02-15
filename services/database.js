const Sequelize = require('sequelize')


class Singleton {
  constructor() {
    if (!Singleton.instance) {
      this.connection = new Sequelize('bankuish-courses', 'damian', '', {
        host: 'localhost',
        dialect: 'postgres',

        pool: {
          max: 5,
          min: 0,
          idle: 10000
        }
      })
    }
  }
}


module.exports = new Singleton()
