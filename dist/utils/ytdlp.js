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
exports.downloadYtDlp = downloadYtDlp;
exports.findYtdlpBinary = findYtdlpBinary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const request_1 = require("../utils/request");
const __1 = require("..");
const DOWNLOAD_BASE_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';
const PLATFORM_MAPPINGS = {
    win32: {
        x64: 'yt-dlp.exe',
        ia32: 'yt-dlp_x86.exe',
    },
    linux: {
        x64: 'yt-dlp',
        armv7l: 'yt-dlp_linux_armv7l',
        aarch64: 'yt-dlp_linux_aarch64',
        arm64: 'yt-dlp',
    },
    darwin: {
        x64: 'yt-dlp_macos',
        arm64: 'yt-dlp_macos',
    },
    android: {
        arm64: 'yt-dlp',
    },
};
function getYtdlpFilename() {
    const platform = process.platform;
    const arch = process.arch;
    if (!PLATFORM_MAPPINGS[platform] || !PLATFORM_MAPPINGS[platform][arch]) {
        throw new Error(`No FFmpeg build available for ${platform} ${arch}`);
    }
    const filename = PLATFORM_MAPPINGS[platform][arch];
    return filename;
}
async function downloadYtDlp(out) {
    const OUT_DIR = out || __1.BIN_DIR;
    const fileName = getYtdlpFilename();
    const downloadUrl = `${DOWNLOAD_BASE_URL}/${fileName}`;
    const outputPath = path.join(OUT_DIR, fileName);
    const isExists = fs.existsSync(outputPath);
    if (isExists)
        return outputPath;
    console.log(`Downloading yt-dlp...`, downloadUrl);
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }
    try {
        await (0, request_1.downloadFile)(downloadUrl, outputPath);
        console.log(`yt-dlp downloaded successfully to: ${outputPath}`);
        try {
            fs.chmodSync(outputPath, 0o755);
        }
        catch {
            console.log('Error while chmod');
        }
        return outputPath;
    }
    catch (error) {
        console.error(`Download failed: ${error}`);
        throw error;
    }
}
function findYtdlpBinary() {
    const platform = process.platform;
    const arch = process.arch;
    try {
        const binaryName = PLATFORM_MAPPINGS[platform][arch];
        const ytdlpPath = path.join(__1.BIN_DIR, binaryName);
        if (!fs.existsSync(ytdlpPath)) {
            throw new Error('Ytdlp binary not found. Please download it first.');
        }
        return ytdlpPath;
    }
    catch {
        return undefined;
    }
}
