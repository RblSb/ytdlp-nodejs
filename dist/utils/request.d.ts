import * as https from 'https';
import * as http from 'http';
export declare function request(url: string, options?: https.RequestOptions): Promise<http.IncomingMessage>;
export declare function downloadFile(url: string, outputPath: string): Promise<void>;
