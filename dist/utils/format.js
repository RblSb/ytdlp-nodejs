"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFormatOptions = parseFormatOptions;
exports.getContentType = getContentType;
exports.getFileExtension = getFileExtension;
const ByQuality = {
    '2160p': 'bv*[height<=2160]',
    '1440p': 'bv*[height<=1440]',
    '1080p': 'bv*[height<=1080]',
    '720p': 'bv*[height<=720]',
    '480p': 'bv*[height<=480]',
    '360p': 'bv*[height<=360]',
    '240p': 'bv*[height<=240]',
    '144p': 'bv*[height<=133]',
    highest: 'bv*',
    lowest: 'wv*',
};
function parseFormatOptions(format) {
    if (!format) {
        return [];
    }
    if (typeof format === 'string') {
        return ['-f', format];
    }
    if (Object.keys(format).length === 0) {
        return ['-f', 'bv*+ba'];
    }
    let formatArr = [];
    const { filter, quality, type } = format;
    if (filter === 'audioonly') {
        formatArr = [
            '-x',
            '--audio-format',
            type ? type : 'mp3',
            '--audio-quality',
            quality ? quality.toString() : '5',
        ];
    }
    if (filter === 'videoonly') {
        formatArr = [
            '-f',
            (quality ? ByQuality[quality] : 'bv*') +
                '[acodec=none]',
        ];
    }
    if (filter === 'audioandvideo') {
        formatArr = [
            '-f',
            (quality == 'lowest' ? 'w*' : 'b*') +
                '[vcodec!=none][acodec!=none][ext=' +
                (type ? type : 'mp4') +
                ']',
        ];
    }
    if (filter === 'mergevideo') {
        const videoQuality = quality
            ? ByQuality[quality]
            : 'bv*';
        formatArr = ['-f', `${videoQuality}+ba`];
        if (type) {
            formatArr.push('--merge-output-format', type);
        }
    }
    return formatArr;
}
function getContentType(format) {
    if (!format || typeof format === 'string') {
        return 'video/mp4';
    }
    const { filter, type } = format;
    switch (filter) {
        case 'videoonly':
        case 'audioandvideo':
            switch (type) {
                case 'mp4':
                    return 'video/mp4';
                case 'webm':
                    return 'video/webm';
                default:
                    return 'video/mp4';
            }
        case 'audioonly':
            switch (type) {
                case 'aac':
                    return 'audio/aac';
                case 'flac':
                    return 'audio/flac';
                case 'mp3':
                    return 'audio/mp3';
                case 'm4a':
                    return 'audio/mp4';
                case 'opus':
                    return 'audio/opus';
                case 'vorbis':
                    return 'audio/vorbis';
                case 'wav':
                    return 'audio/wav';
                case 'alac':
                    return 'audio/mp4';
                default:
                    return 'audio/mpeg';
            }
        case 'mergevideo':
            switch (type) {
                case 'webm':
                    return 'video/webm';
                case 'mkv':
                    return 'video/x-matroska';
                case 'ogg':
                    return 'video/ogg';
                case 'flv':
                    return 'video/x-flv';
                default:
                    return 'video/mp4';
            }
    }
}
function getFileExtension(format) {
    if (!format || typeof format === 'string') {
        return 'mp4';
    }
    const { filter, type } = format;
    if (type) {
        return type;
    }
    return filter === 'audioonly' ? 'mp3' : 'mp4';
}
