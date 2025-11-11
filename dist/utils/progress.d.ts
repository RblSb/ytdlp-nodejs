import { VideoProgress } from '../types';
export declare const PROGRESS_STRING = "~ytdlp-progress-%(progress)#j";
export declare function formatBytes(bytes: string | number, decimals?: number): string;
export declare function percentage(partialValue: string | number, totalValue: string | number): number;
export declare function secondsToHms(d: number | string): string;
export declare function stringToProgress(str: string): VideoProgress | undefined;
