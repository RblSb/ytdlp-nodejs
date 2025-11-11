#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_util_1 = require("node:util");
const __1 = require("..");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ytdlp_1 = require("./ytdlp");
const ffmpeg_1 = require("./ffmpeg");
const args = process.argv.slice(2);
const { values } = (0, node_util_1.parseArgs)({
    args,
    options: {
        download: {
            type: 'string',
            short: 'd',
            choices: ['ffmpeg', 'ytdlp'],
            default: 'ffmpeg',
        },
        out: {
            type: 'string',
            short: 'o',
            default: __1.BIN_DIR,
        },
    },
});
const outDir = path_1.default.resolve(values.out);
if (!fs_1.default.existsSync(outDir)) {
    try {
        fs_1.default.mkdirSync(outDir, { recursive: true });
        console.log(`Created directory: ${outDir}`);
    }
    catch (err) {
        console.error(`Error creating directory ${outDir}:`, err);
        process.exit(1);
    }
}
if (values.download == 'ytdlp') {
    (0, ytdlp_1.downloadYtDlp)(outDir);
}
else if (values.download == 'ffmpeg') {
    (0, ffmpeg_1.downloadFFmpeg)(outDir);
}
else {
    console.error('Please select ffmpeg or ytdlp to download');
}
