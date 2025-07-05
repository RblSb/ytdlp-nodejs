"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRESS_STRING = void 0;
exports.formatBytes = formatBytes;
exports.percentage = percentage;
exports.secondsToHms = secondsToHms;
exports.stringToProgress = stringToProgress;
exports.PROGRESS_STRING = 'bright-{"status":"%(progress.status)s","downloaded":"%(progress.downloaded_bytes)s","total":"%(progress.total_bytes)s","total_estimate":"%(progress.total_bytes_estimate)s","speed":"%(progress.speed)s","eta":"%(progress.eta)s"}';
function formatBytes(bytes, decimals = 2) {
    const newBytes = Number(bytes);
    if (newBytes === 0 || isNaN(newBytes))
        return newBytes + ' Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(newBytes) / Math.log(k));
    return parseFloat((newBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
function toFixedNumber(num, digits, base) {
    const pow = Math.pow(base || 10, digits);
    return Math.round(num * pow) / pow;
}
function percentage(partialValue, totalValue) {
    return toFixedNumber((100 * Number(partialValue)) / Number(totalValue), 2);
}
function secondsToHms(d) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);
    const hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
    const mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
    const sDisplay = s >= 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
    return hDisplay + mDisplay + sDisplay;
}
function stringToProgress(str) {
    try {
        if (!str.includes('bright'))
            throw new Error();
        const jsonStr = str.split('\r')?.[1]?.trim()?.split('-')?.[1];
        if (!jsonStr)
            throw new Error();
        const object = JSON.parse(jsonStr);
        const total = isNaN(Number(object.total))
            ? Number(object.total_estimate)
            : Number(object.total);
        return {
            status: object.status,
            downloaded: Number(object.downloaded),
            downloaded_str: formatBytes(object.downloaded),
            total: total,
            total_str: formatBytes(total),
            speed: Number(object.speed),
            speed_str: formatBytes(object.speed) + '/s',
            eta: Number(object.eta),
            eta_str: secondsToHms(object.eta),
            percentage: percentage(object.downloaded, total),
            percentage_str: percentage(object.downloaded, total) + '%',
        };
    }
    catch {
        return undefined;
    }
}
