import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Blob } from 'buffer';
import {
  ArgsOptions,
  DownloadKeyWord,
  DownloadOptions,
  FileMetadata,
  GetFileOptions,
  PipeResponse,
  StreamKeyWord,
  StreamOptions,
  VideoInfo,
  VideoProgress,
  VideoThumbnail,
  YtDlpOptions,
} from './types';
import { createArgs } from './utils/args';
import { extractThumbnails } from './utils/thumbnails';
import {
  getContentType,
  getFileExtension,
  parseDownloadOptions,
  parseStreamOptions,
} from './utils/format';
import { PROGRESS_STRING, stringToProgress } from './utils/progress';
import { PassThrough } from 'stream';
import { downloadFFmpeg, findFFmpegBinary } from './utils/ffmpeg';

export const BIN_DIR = path.join(__dirname, '..', 'bin');

export class YtDlp {
  private readonly binaryPath: string;
  private readonly ffmpegPath?: string;

  // done
  constructor(opt?: YtDlpOptions) {
    this.binaryPath = opt?.binaryPath || this.getDefaultBinaryPath();
    this.ffmpegPath = opt?.ffmpegPath;

    const ffmpegBinary = findFFmpegBinary();

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
  private getDefaultBinaryPath(): string {
    return path.join(
      BIN_DIR,
      os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
    );
  }

  // done
  public async checkInstallationAsync(options?: {
    ffmpeg?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (options?.ffmpeg && !this.ffmpegPath) {
        return reject(new Error('FFmpeg path is not set'));
      }

      const binaryProcess = spawn(this.binaryPath, ['--version']);
      const ffmpegProcess = options?.ffmpeg
        ? spawn(this.ffmpegPath!, ['--version'])
        : null;

      let binaryExists = false;
      let ffmpegExists = !options?.ffmpeg;

      binaryProcess.on('error', () => (binaryExists = false));
      binaryProcess.on('exit', (code) => {
        binaryExists = code === 0;
        if (binaryExists && ffmpegExists) resolve(true);
      });

      if (ffmpegProcess) {
        ffmpegProcess.on('error', () => (ffmpegExists = false));
        ffmpegProcess.on('exit', (code) => {
          ffmpegExists = code === 0;
          if (binaryExists && ffmpegExists) resolve(true);
        });
      }
    });
  }

  // done
  public checkInstallation(options?: { ffmpeg?: boolean }): boolean {
    if (options?.ffmpeg && !this.ffmpegPath) {
      throw new Error('FFmpeg path is not set');
    }

    const binaryResult = spawnSync(this.binaryPath, ['--version'], {
      stdio: 'ignore',
    });
    const ffmpegResult = options?.ffmpeg
      ? spawnSync(this.ffmpegPath!, ['--version'], { stdio: 'ignore' })
      : { status: 0 };
    return binaryResult.status === 0 && ffmpegResult.status === 0;
  }

  // done
  public async execAsync(
    url: string,
    options?: ArgsOptions & {
      onData?: (d: string) => void;
      onProgress?: (p: VideoProgress) => void;
    }
  ) {
    const args = this.buildArgs(url, options || {});
    const onData = (d: string) => {
      options?.onData?.(d);
      if (options?.onProgress) {
        const result = stringToProgress(d);
        if (result) {
          options.onProgress?.(result);
        }
      }
    };
    return this._executeAsync(args, onData);
  }

  // done
  public exec(url: string, options?: ArgsOptions) {
    const args = this.buildArgs(url, options || {}, true);
    return this._execute(args);
  }

  // done
  private _execute(args: string[]) {
    const ytDlpProcess = spawn(this.binaryPath, args);

    ytDlpProcess.stderr.on('data', (chunk) => {
      const str = Buffer.from(chunk).toString();
      const result = stringToProgress(str);
      if (result) {
        ytDlpProcess.emit('progress', result);
      }
    });

    ytDlpProcess.stdout.on('data', (data) => {
      const dataStr = Buffer.from(data).toString();
      const result = stringToProgress(dataStr);
      if (result) {
        ytDlpProcess.emit('progress', result);
      }
    });

    return ytDlpProcess;
  }

  // done
  private async _executeAsync(
    args: string[],
    onData?: (d: string) => void,
    passThrough?: PassThrough
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytDlpProcess = spawn(this.binaryPath, args);

      let stdoutData = '';
      let stderrData = '';

      ytDlpProcess.stdout.on('data', (data) => {
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
        } else {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderrData}`));
        }
      });

      ytDlpProcess.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp process: ${err.message}`));
      });
    });
  }

  // done
  private buildArgs(
    url: string,
    opt: ArgsOptions,
    onProgress?: ((p: VideoProgress) => void) | boolean,
    extra?: string[]
  ): string[] {
    const args = createArgs(opt);
    if (this.ffmpegPath) {
      args.push('--ffmpeg-location', this.ffmpegPath);
    }

    if (onProgress) {
      args.push('--progress-template', PROGRESS_STRING);
    }

    if (extra) {
      args.push(...extra);
    }

    return args.concat(url);
  }

  // done
  public download<F extends DownloadKeyWord>(
    url: string,
    options?: Omit<DownloadOptions<F>, 'onProgress'>
  ) {
    const { format, ...opt } = options || {};
    const args = this.buildArgs(url, opt, true, parseDownloadOptions(format));

    return this._execute(args);
  }

  // done
  public async downloadAsync<F extends DownloadKeyWord>(
    url: string,
    options?: DownloadOptions<F>
  ): Promise<string> {
    const { format, onProgress, ...opt } = options || {};
    const args = this.buildArgs(
      url,
      opt,
      onProgress,
      parseDownloadOptions(format)
    );

    return this._executeAsync(args, (data) => {
      const progress = stringToProgress(data);
      if (progress) {
        onProgress?.(progress);
      }
    });
  }

  // done
  public stream<F extends StreamKeyWord>(
    url: string,
    options?: StreamOptions<F>
  ): PipeResponse {
    const { format, onProgress, ...opt } = options || {};
    const args = this.buildArgs(url, opt, onProgress, [
      ...parseStreamOptions(format),
      '-o',
      '-',
    ]);

    const passThrough = new PassThrough();

    this._executeAsync(
      args,
      (data) => {
        const progress = stringToProgress(data);
        if (progress) {
          onProgress?.(progress);
        }
      },
      passThrough
    );

    return {
      pipe: (destination: NodeJS.WritableStream, options?: { end?: boolean }) =>
        passThrough.pipe(destination, options),
      pipeAsync: (
        destination: NodeJS.WritableStream,
        options?: { end?: boolean }
      ) => {
        return new Promise((resolve, reject) => {
          const pt = passThrough.pipe(destination, options);
          destination.on('finish', () => resolve(pt));
          destination.on('error', reject);
        });
      },
    };
  }

  // done
  public async getInfoAsync(url: string): Promise<VideoInfo> {
    const args = ['--dump-json', '--quiet', url];
    const execResult = await this._executeAsync(args);
    return JSON.parse(execResult) as VideoInfo;
  }

  // done
  public async getThumbnailsAsync(url: string): Promise<VideoThumbnail[]> {
    const args = ['--list-thumbnails', '--quiet', url];
    const execResult = await this._executeAsync(args);
    return extractThumbnails(execResult);
  }

  // done
  public async getTitleAsync(url: string): Promise<string> {
    const args = ['--print', 'title', url];
    const execResult = await this._executeAsync(args);
    return execResult;
  }

  public async downloadFFmpeg() {
    return downloadFFmpeg();
  }

  public async getFileAsync<F extends DownloadKeyWord>(
    url: string,
    options?: GetFileOptions<F> & {
      onProgress?: (p: VideoProgress) => void;
    }
  ): Promise<File> {
    const info = await this.getInfoAsync(url);
    const { format, filename, metadata, onProgress, ...opt } = options || {};

    // PassThrough stream to collect data
    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];

    passThrough.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

    const args = this.buildArgs(url, opt, !!onProgress, [
      ...parseDownloadOptions(format),
      '-o',
      '-',
    ]);

    await this._executeAsync(
      args,
      (data) => {
        if (onProgress) {
          const progress = stringToProgress(data);
          if (progress) {
            onProgress(progress);
          }
        }
      },
      passThrough
    );

    const blob = new Blob(chunks, { type: getContentType(format) });

    const defaultMetadata: FileMetadata = {
      name: filename || `${info.title}.${getFileExtension(format)}`,
      type: getContentType(format),
      size: blob.size,
      ...metadata,
    };
    return new File([Buffer.concat(chunks)], defaultMetadata.name, {
      type: defaultMetadata.type,
    });
  }
}

export type {
  ArgsOptions,
  DownloadOptions,
  StreamOptions,
  VideoInfo,
  VideoProgress,
  VideoThumbnail,
  YtDlpOptions,
};
