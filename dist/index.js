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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpers = exports.YtDlp = exports.BIN_DIR = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const buffer_1 = require("buffer");
const args_1 = require("./utils/args");
const thumbnails_1 = require("./utils/thumbnails");
const format_1 = require("./utils/format");
const progress_1 = require("./utils/progress");
const stream_1 = require("stream");
const ffmpeg_1 = require("./utils/ffmpeg");
const request_1 = require("./utils/request");
exports.BIN_DIR = path.join(__dirname, '..', 'bin');
class YtDlp {
    // done
    constructor(opt) {
        this.binaryPath = opt?.binaryPath || this.getDefaultBinaryPath();
        this.ffmpegPath = opt?.ffmpegPath;
        const ffmpegBinary = (0, ffmpeg_1.findFFmpegBinary)();
        if (ffmpegBinary) {
            this.ffmpegPath = ffmpegBinary;
        }
        if (!fs.existsSync(this.binaryPath))
            throw new Error('yt-dlp binary not found');
        fs.chmodSync(this.binaryPath, 0o755);
        if (this.ffmpegPath && !fs.existsSync(this.ffmpegPath)) {
            throw new Error('ffmpeg binary not found');
        }
    }
    // done
    getDefaultBinaryPath() {
        const platform = os.platform();
        let binaryName;
        if (platform === 'win32') {
            binaryName = 'yt-dlp.exe';
        }
        else if (platform === 'darwin') {
            binaryName = 'yt-dlp_macos';
        }
        else {
            binaryName = 'yt-dlp';
        }
        return path.join(exports.BIN_DIR, binaryName);
    }
    // done
    async checkInstallationAsync(options) {
        return new Promise((resolve, reject) => {
            if (options?.ffmpeg && !this.ffmpegPath) {
                return reject(new Error('FFmpeg path is not set'));
            }
            const binaryProcess = (0, child_process_1.spawn)(this.binaryPath, ['--version']);
            let binaryExists = false;
            let ffmpegExists = !options?.ffmpeg;
            binaryProcess.on('error', () => (binaryExists = false));
            binaryProcess.on('exit', (code) => {
                binaryExists = code === 0;
                if (options?.ffmpeg) {
                    const ffmpegProcess = (0, child_process_1.spawn)(this.ffmpegPath, ['--version']);
                    ffmpegProcess.on('error', () => (ffmpegExists = false));
                    ffmpegProcess.on('exit', (code) => {
                        ffmpegExists = code === 0;
                        if (binaryExists && ffmpegExists) {
                            resolve(true);
                        }
                        else {
                            resolve(false);
                        }
                    });
                }
                else {
                    if (binaryExists) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                }
            });
        });
    }
    // done
    checkInstallation(options) {
        if (options?.ffmpeg && !this.ffmpegPath) {
            throw new Error('FFmpeg path is not set');
        }
        const binaryResult = (0, child_process_1.spawnSync)(this.binaryPath, ['--version'], {
            stdio: 'ignore',
        });
        const ffmpegResult = options?.ffmpeg
            ? (0, child_process_1.spawnSync)(this.ffmpegPath, ['--version'], { stdio: 'ignore' })
            : { status: 0 };
        return binaryResult.status === 0 && ffmpegResult.status === 0;
    }
    // done
    async execAsync(url, options) {
        const args = this.buildArgs(url, options || {});
        const onData = (d) => {
            options?.onData?.(d);
            if (options?.onProgress) {
                const result = (0, progress_1.stringToProgress)(d);
                if (result) {
                    options.onProgress?.(result);
                }
            }
        };
        return this._executeAsync(args, onData);
    }
    // done
    exec(url, options) {
        const args = this.buildArgs(url, options || {}, true);
        return this._execute(args);
    }
    // done
    _execute(args) {
        const ytDlpProcess = (0, child_process_1.spawn)(this.binaryPath, args);
        ytDlpProcess.stderr.on('data', (chunk) => {
            const str = Buffer.from(chunk).toString();
            const result = (0, progress_1.stringToProgress)(str);
            if (result) {
                ytDlpProcess.emit('progress', result);
            }
        });
        ytDlpProcess.stdout.on('data', (data) => {
            const dataStr = Buffer.from(data).toString();
            const result = (0, progress_1.stringToProgress)(dataStr);
            if (result) {
                ytDlpProcess.emit('progress', result);
            }
        });
        return ytDlpProcess;
    }
    // done
    async _executeAsync(args, onData, passThrough) {
        return new Promise((resolve, reject) => {
            const ytDlpProcess = (0, child_process_1.spawn)(this.binaryPath, args);
            let stdoutData = '';
            let stderrData = '';
            ytDlpProcess.stdout.on('data', (data) => {
                // in `passThrough` case `data` is video bytes, don't collect it
                if (passThrough)
                    return;
                stdoutData += data.toString();
                onData?.(Buffer.from(data).toString());
            });
            ytDlpProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
                onData?.(Buffer.from(data).toString());
            });
            if (passThrough) {
                ytDlpProcess.stdout.pipe(passThrough);
            }
            ytDlpProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(stdoutData);
                }
                else {
                    reject(new Error(`yt-dlp exited with code ${code}: ${stderrData}`));
                }
            });
            ytDlpProcess.on('error', (err) => {
                reject(new Error(`Failed to start yt-dlp process: ${err.message}`));
            });
        });
    }
    // done
    buildArgs(url, opt, isProgress, extra) {
        const args = (0, args_1.createArgs)(opt);
        if (this.ffmpegPath) {
            args.push('--ffmpeg-location', this.ffmpegPath);
        }
        if (isProgress) {
            args.push('--progress-template', progress_1.PROGRESS_STRING);
        }
        if (extra) {
            args.push(...extra);
        }
        return args.concat(url);
    }
    // done
    download(url, options) {
        const { format, ...opt } = options || {};
        const args = this.buildArgs(url, opt, true, (0, format_1.parseFormatOptions)(format));
        return this._execute(args);
    }
    // done
    async downloadAsync(url, options) {
        const { format, onProgress, ...opt } = options || {};
        const args = this.buildArgs(url, opt, !!onProgress, (0, format_1.parseFormatOptions)(format));
        return this._executeAsync(args, (data) => {
            const progress = (0, progress_1.stringToProgress)(data);
            if (progress) {
                onProgress?.(progress);
            }
        });
    }
    // done
    stream(url, options) {
        const { format, onProgress, ...opt } = options || {};
        const args = this.buildArgs(url, opt, !!onProgress, [
            ...(0, format_1.parseFormatOptions)(format),
            '-o',
            '-',
        ]);
        const passThrough = new stream_1.PassThrough();
        const promise = this._executeAsync(args, (data) => {
            const progress = (0, progress_1.stringToProgress)(data);
            if (progress) {
                onProgress?.(progress);
            }
        }, passThrough);
        return {
            promise: promise,
            pipe: (destination, options) => passThrough.pipe(destination, options),
            pipeAsync: (destination, options) => {
                return new Promise((resolve, reject) => {
                    const pt = passThrough.pipe(destination, options);
                    destination.on('finish', () => resolve(pt));
                    destination.on('error', reject);
                });
            },
        };
    }
    // done
    async getInfoAsync(url, options) {
        const args = [
            '--dump-single-json',
            '--quiet',
            ...(0, args_1.createArgs)({ flatPlaylist: true, ...options }),
            url,
        ];
        const execResult = await this._executeAsync(args);
        return JSON.parse(execResult);
    }
    // done
    async getThumbnailsAsync(url) {
        const args = [
            '--print',
            'thumbnails_table',
            '--print',
            'playlist:thumbnails_table',
            '--quiet',
            url,
        ];
        const execResult = await this._executeAsync(args);
        return (0, thumbnails_1.extractThumbnails)(execResult);
    }
    // done
    async getTitleAsync(url) {
        const args = ['--print', 'title', url];
        const execResult = await this._executeAsync(args);
        return execResult;
    }
    async downloadFFmpeg() {
        return (0, ffmpeg_1.downloadFFmpeg)();
    }
    async getFileAsync(url, options) {
        const info = await this.getInfoAsync(url);
        const { format, filename, metadata, onProgress, ...opt } = options || {};
        // PassThrough stream to collect data
        const passThrough = new stream_1.PassThrough();
        const chunks = [];
        passThrough.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        const args = this.buildArgs(url, opt, !!onProgress, [
            ...(0, format_1.parseFormatOptions)(format),
            '-o',
            '-',
        ]);
        await this._executeAsync(args, (data) => {
            if (onProgress) {
                const progress = (0, progress_1.stringToProgress)(data);
                if (progress) {
                    onProgress(progress);
                }
            }
        }, passThrough);
        const blob = new buffer_1.Blob(chunks, { type: (0, format_1.getContentType)(format) });
        const defaultMetadata = {
            name: filename || `${info.title}.${(0, format_1.getFileExtension)(format)}`,
            type: (0, format_1.getContentType)(format),
            size: blob.size,
            ...metadata,
        };
        return new File([Buffer.concat(chunks)], defaultMetadata.name, {
            type: defaultMetadata.type,
        });
    }
}
exports.YtDlp = YtDlp;
exports.helpers = {
    downloadFFmpeg: ffmpeg_1.downloadFFmpeg,
    findFFmpegBinary: ffmpeg_1.findFFmpegBinary,
    PROGRESS_STRING: progress_1.PROGRESS_STRING,
    getContentType: format_1.getContentType,
    getFileExtension: format_1.getFileExtension,
    parseFormatOptions: format_1.parseFormatOptions,
    stringToProgress: progress_1.stringToProgress,
    createArgs: args_1.createArgs,
    extractThumbnails: thumbnails_1.extractThumbnails,
    downloadFile: request_1.downloadFile,
    BIN_DIR: exports.BIN_DIR,
};
