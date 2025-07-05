import { ArgsOptions, GetFileOptions, InfoType, PipeResponse, PlaylistInfo, FormatKeyWord, FormatOptions, VideoInfo, VideoProgress, VideoThumbnail, YtDlpOptions, InfoOptions } from './types';
import { createArgs } from './utils/args';
import { extractThumbnails } from './utils/thumbnails';
import { getContentType, getFileExtension, parseFormatOptions } from './utils/format';
import { stringToProgress } from './utils/progress';
import { downloadFFmpeg, findFFmpegBinary } from './utils/ffmpeg';
import { downloadFile } from './utils/request';
export declare const BIN_DIR: string;
export declare class YtDlp {
    private readonly binaryPath;
    private readonly ffmpegPath?;
    constructor(opt?: YtDlpOptions);
    private getDefaultBinaryPath;
    checkInstallationAsync(options?: {
        ffmpeg?: boolean;
    }): Promise<boolean>;
    checkInstallation(options?: {
        ffmpeg?: boolean;
    }): boolean;
    execAsync(url: string, options?: ArgsOptions & {
        onData?: (d: string) => void;
        onProgress?: (p: VideoProgress) => void;
    }): Promise<string>;
    exec(url: string, options?: ArgsOptions): import("child_process").ChildProcessWithoutNullStreams;
    private _execute;
    private _executeAsync;
    private buildArgs;
    download<F extends FormatKeyWord>(url: string, options?: Omit<FormatOptions<F>, 'onProgress'>): import("child_process").ChildProcessWithoutNullStreams;
    downloadAsync<F extends FormatKeyWord>(url: string, options?: FormatOptions<F>): Promise<string>;
    stream<F extends FormatKeyWord>(url: string, options?: FormatOptions<F>): PipeResponse;
    getInfoAsync<T extends InfoType>(url: string, options?: InfoOptions): Promise<T extends 'video' ? VideoInfo : PlaylistInfo>;
    getThumbnailsAsync(url: string): Promise<VideoThumbnail[]>;
    getTitleAsync(url: string): Promise<string>;
    downloadFFmpeg(): Promise<string | undefined>;
    getFileAsync<F extends FormatKeyWord>(url: string, options?: GetFileOptions<F> & {
        onProgress?: (p: VideoProgress) => void;
    }): Promise<File>;
}
export declare const helpers: {
    downloadFFmpeg: typeof downloadFFmpeg;
    findFFmpegBinary: typeof findFFmpegBinary;
    PROGRESS_STRING: string;
    getContentType: typeof getContentType;
    getFileExtension: typeof getFileExtension;
    parseFormatOptions: typeof parseFormatOptions;
    stringToProgress: typeof stringToProgress;
    createArgs: typeof createArgs;
    extractThumbnails: typeof extractThumbnails;
    downloadFile: typeof downloadFile;
    BIN_DIR: string;
};
export type { ArgsOptions, FormatOptions, VideoInfo, VideoProgress, VideoThumbnail, YtDlpOptions, PlaylistInfo, };
