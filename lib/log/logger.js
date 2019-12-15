const log4js = require("log4js");
const config = require("../../config/log4js.config");
let console, system;

log4js.configure(config);

console = log4js.getLogger();
system = log4js.getLogger("system");

module.exports = {
  console,
  system
};
