const logger = require("./logger").system;

module.exports = options => {
  return (err, req, res, next) => {
    logger.error(err.message);
    next(err);
  };
};
