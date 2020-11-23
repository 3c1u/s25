/* tslint:disable */
/* eslint-disable */
/**
*/
export class Metadata {
  free(): void;
/**
* Position of image.
* @returns {number}
*/
  head: number;
/**
* Height.
* @returns {number}
*/
  height: number;
/**
* Whether the image uses incremental encoding.
* @returns {boolean}
*/
  incremental: boolean;
/**
* X-axis value of the image offset.
* @returns {number}
*/
  offset_x: number;
/**
* Y-axis value of the image offset.
* @returns {number}
*/
  offset_y: number;
/**
* Width.
* @returns {number}
*/
  width: number;
}
/**
*/
export class S25 {
  free(): void;
/**
* @param {Uint8Array} array
* @returns {S25 | undefined}
*/
  static open(array: Uint8Array): S25 | undefined;
/**
* @returns {number}
*/
  total_entries(): number;
/**
* @param {number} entry
* @returns {boolean}
*/
  exists(entry: number): boolean;
/**
* @param {number} entry
* @returns {Int32Array | undefined}
*/
  get_size(entry: number): Int32Array | undefined;
/**
* @param {number} entry
* @returns {Metadata | undefined}
*/
  get_metadata(entry: number): Metadata | undefined;
/**
* @param {number} entry
* @returns {Uint8Array | undefined}
*/
  decode(entry: number): Uint8Array | undefined;
/**
* @param {number} entry
* @returns {Uint8Array | undefined}
*/
  decode_rgba(entry: number): Uint8Array | undefined;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_s25_free: (a: number) => void;
  readonly __wbg_metadata_free: (a: number) => void;
  readonly __wbg_get_metadata_width: (a: number) => number;
  readonly __wbg_set_metadata_width: (a: number, b: number) => void;
  readonly __wbg_get_metadata_height: (a: number) => number;
  readonly __wbg_set_metadata_height: (a: number, b: number) => void;
  readonly __wbg_get_metadata_offset_x: (a: number) => number;
  readonly __wbg_set_metadata_offset_x: (a: number, b: number) => void;
  readonly __wbg_get_metadata_offset_y: (a: number) => number;
  readonly __wbg_set_metadata_offset_y: (a: number, b: number) => void;
  readonly __wbg_get_metadata_incremental: (a: number) => number;
  readonly __wbg_set_metadata_incremental: (a: number, b: number) => void;
  readonly __wbg_get_metadata_head: (a: number) => number;
  readonly __wbg_set_metadata_head: (a: number, b: number) => void;
  readonly s25_open: (a: number) => number;
  readonly s25_exists: (a: number, b: number) => number;
  readonly s25_get_size: (a: number, b: number) => number;
  readonly s25_get_metadata: (a: number, b: number) => number;
  readonly s25_decode: (a: number, b: number) => number;
  readonly s25_decode_rgba: (a: number, b: number) => number;
  readonly s25_total_entries: (a: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
        