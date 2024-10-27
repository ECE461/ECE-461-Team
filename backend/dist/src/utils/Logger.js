"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["SILENT"] = 0] = "SILENT";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 2] = "DEBUG";
})(LogLevel || (LogLevel = {}));
// Set settings from environment variables
const envLogLevel = process.env.LOG_LEVEL;
const logLevel = (envLogLevel !== undefined && !isNaN(Number(envLogLevel)) && Object.values(LogLevel).includes(Number(envLogLevel))) ? Number(envLogLevel) : LogLevel.DEBUG;
const defaultFilePath = path_1.default.join(__dirname, '../default.log');
const logFilePath = process.env.LOG_FILE || defaultFilePath;
// Create log file if it does not exist
if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', { flag: 'w' });
}
/**
 * [getFileLineInfo] - Extracts the file and line number from the stack trace
 * @param stackTrace
 * @returns
 */
const getFileLineInfo = (stackTrace) => {
    // Stack traces typically contain the current file as the first entry
    const lines = stackTrace.split('\n');
    // Usually, the caller's information is the second line (index 1)
    const callerLine = lines[2] || '';
    const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
    if (match) {
        const [, file, line] = match;
        return `${path_1.default.basename(file)}:${line}`;
    }
    return '-:-';
};
/**
 * [Logger] - Class to log messages to a file
 * @method logInfo
 * Example Usage:
 *      import { Logger } from './<path_to_dir>/logUtils';
 *      Logger.logInfo("Info Message"); // Logs to file if log level is INFO(1) or higher
 *      Logger.logDebug("Debug Message"); // Logs to file if log level is DEBUG(2) or higher
 */
class Logger {
    /**
     * [logInfo] - Logs message to file if log level is INFO(1) or higher
     * @param message
     */
    static logInfo(message) {
        if (logLevel >= LogLevel.INFO) {
            try {
                const stackTrace = new Error().stack || '';
                const fileLineInfo = getFileLineInfo(stackTrace);
                fs.appendFileSync(logFilePath, `[${fileLineInfo}] ${message}\n`, 'utf8');
            }
            catch (error) {
                console.error('Error writing to log file:', error);
            }
        }
    }
    /**
     * [logDebug] - Logs message to file if log level is DEBUG(2) or higher
     * @param message
     */
    static logDebug(message) {
        if (logLevel >= LogLevel.DEBUG) {
            try {
                const stackTrace = new Error().stack || '';
                const fileLineInfo = getFileLineInfo(stackTrace);
                const logMessage = (message instanceof Error) ? `${message.message}\n${message.stack}` : message;
                fs.appendFileSync(logFilePath, `[${fileLineInfo}] ${logMessage}\n`, 'utf8');
            }
            catch (error) {
                console.error('Error writing to log file:', error);
            }
        }
    }
}
exports.Logger = Logger;
