import { FormatKeyWord, FormatOptions } from '../types';
export declare function parseFormatOptions<T extends FormatKeyWord>(format?: FormatOptions<T>['format'] | string): string[];
export declare function getContentType(format?: FormatOptions<FormatKeyWord>['format']): string;
export declare function getFileExtension(format?: FormatOptions<FormatKeyWord>['format']): string;
