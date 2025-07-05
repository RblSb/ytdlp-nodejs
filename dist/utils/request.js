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
exports.request = request;
exports.downloadFile = downloadFile;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
const fs = __importStar(require("fs"));
function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new url_1.URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        const req = protocol.get(url, options, (response) => {
            if (response.statusCode >= 300 &&
                response.statusCode < 400 &&
                response.headers.location) {
                const redirectUrl = new url_1.URL(response.headers.location, url).toString();
                request(redirectUrl, options).then(resolve).catch(reject);
                return;
            }
            resolve(response);
        });
        req.on('error', reject);
        // Set a timeout
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
    });
}
async function downloadFile(url, outputPath) {
    try {
        const fileStream = fs.createWriteStream(outputPath);
        const response = await request(url);
        if (response.statusCode !== 200) {
            fileStream.close();
            fs.unlinkSync(outputPath);
            throw new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`);
        }
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        response.on('data', (chunk) => {
            downloadedSize += chunk.length;
            const progress = (downloadedSize / totalSize) * 100;
            process.stdout.write(`Progress: ${Math.round(progress)}%\r`);
        });
        response.pipe(fileStream);
        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                fileStream.close();
                console.log('\nDownload complete!');
                resolve();
            });
            fileStream.on('error', (err) => {
                fileStream.close();
                fs.unlinkSync(outputPath);
                reject(err);
            });
            response.on('error', (err) => {
                fileStream.close();
                fs.unlinkSync(outputPath);
                reject(err);
            });
        });
    }
    catch (error) {
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        throw error;
    }
}
