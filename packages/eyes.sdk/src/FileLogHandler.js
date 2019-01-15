(function () {
  'use strict';

  var path = require('path');
  var fs = require('fs');

  var LogHandler = require('./LogHandler').LogHandler;

  /**
   * Write log massages to the browser/node console
   *
   * @param {boolean} isVerbose Whether to handle or ignore verbose log messages.
   * @param {String} [filename] The file in which to save the logs.
   * @param {boolean} [append=true] Whether to append the logs to existing file, or to overwrite the existing file.
   * @constructor
   * @extends LogHandler
   **/
  function FileLogHandler(isVerbose, filename, append) {
    LogHandler.call(this);

    this._filename = filename || 'eyes.log';
    this._append = append !== undefined ? append : true;
    this.setIsVerbose(isVerbose);
  }

  FileLogHandler.prototype = Object.create(LogHandler.prototype);
  FileLogHandler.prototype.constructor = LogHandler;

  //noinspection JSUnusedGlobalSymbols
  /**
   * The name of the log file.
   *
   * @param {string} fileName
   */
  FileLogHandler.prototype.setFileName = function (fileName) {
    this._fileName = fileName;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The name of the log file.
   *
   * @return {string} the file name
   */
  FileLogHandler.prototype.getFileName = function () {
    return this._fileName;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The path of the log file folder.
   *
   * @param {string} fileDirectory
   */
  FileLogHandler.prototype.setFileDirectory = function (fileDirectory) {
    this._fileDirectory = fileDirectory;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * The path of the log file folder.
   *
   * @return {string} the file Directory
   */
  FileLogHandler.prototype.getFileDirectory = function () {
    return this._fileDirectory;
  };

  /**
   * Create a winston file logger
   */
  FileLogHandler.prototype.open = function () {
    this.close();

    var file = path.normalize(this._filename);
    var opts = {
      flags: this._append ? 'a' : 'w',
      encoding: 'utf8'
    };

    this._writer = fs.createWriteStream(file, opts);
  };

  /**
   * Close the winston file logger
   */
  FileLogHandler.prototype.close = function () {
    if (this._writer) {
      this._writer.end('\n');
      this._writer = undefined;
    }
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * Handle a message to be logged.
   *
   * @param {boolean} verbose Whether this message is flagged as verbose or not.
   * @param {String} logString The string to log.
   */
  FileLogHandler.prototype.onMessage = function (verbose, logString) {
    if (this._writer && (!verbose || this._isVerbose)) {
      this._writer.write(this.formatMessage(logString) + '\n');
    }
  };

  exports.FileLogHandler = FileLogHandler;
}());
