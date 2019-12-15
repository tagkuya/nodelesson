const root = require("../util/path");
const path = require("path");

module.exports = {
  appenders: {
    ConsoleLogAppenders: {
      type: "console"
    },
    FileLogAppender: {
      type: "file",
      filename: path.join(root, "./log/system/system.log"),
      maxLogSize: 5000000,
      backus: 10
    }
  },
  categories: {
    default: {
      appenders: ["ConsoleLogAppenders"],
      level: "ALL"
    },
    system: {
      appenders: ["FileLogAppender"],
      level: "ERROR"
    }
  }
};
