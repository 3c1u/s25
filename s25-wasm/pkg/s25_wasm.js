
let wasm;

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}
/**
*/
export class Metadata {

    static __wrap(ptr) {
        const obj = Object.create(Metadata.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_metadata_free(ptr);
    }
    /**
    * Width.
    * @returns {number}
    */
    get width() {
        var ret = wasm.__wbg_get_metadata_width(this.ptr);
        return ret;
    }
    /**
    * Width.
    * @param {number} arg0
    */
    set width(arg0) {
        wasm.__wbg_set_metadata_width(this.ptr, arg0);
    }
    /**
    * Height.
    * @returns {number}
    */
    get height() {
        var ret = wasm.__wbg_get_metadata_height(this.ptr);
        return ret;
    }
    /**
    * Height.
    * @param {number} arg0
    */
    set height(arg0) {
        wasm.__wbg_set_metadata_height(this.ptr, arg0);
    }
    /**
    * X-axis value of the image offset.
    * @returns {number}
    */
    get offset_x() {
        var ret = wasm.__wbg_get_metadata_offset_x(this.ptr);
        return ret;
    }
    /**
    * X-axis value of the image offset.
    * @param {number} arg0
    */
    set offset_x(arg0) {
        wasm.__wbg_set_metadata_offset_x(this.ptr, arg0);
    }
    /**
    * Y-axis value of the image offset.
    * @returns {number}
    */
    get offset_y() {
        var ret = wasm.__wbg_get_metadata_offset_y(this.ptr);
        return ret;
    }
    /**
    * Y-axis value of the image offset.
    * @param {number} arg0
    */
    set offset_y(arg0) {
        wasm.__wbg_set_metadata_offset_y(this.ptr, arg0);
    }
    /**
    * Whether the image uses incremental encoding.
    * @returns {boolean}
    */
    get incremental() {
        var ret = wasm.__wbg_get_metadata_incremental(this.ptr);
        return ret !== 0;
    }
    /**
    * Whether the image uses incremental encoding.
    * @param {boolean} arg0
    */
    set incremental(arg0) {
        wasm.__wbg_set_metadata_incremental(this.ptr, arg0);
    }
    /**
    * Position of image.
    * @returns {number}
    */
    get head() {
        var ret = wasm.__wbg_get_metadata_head(this.ptr);
        return ret;
    }
    /**
    * Position of image.
    * @param {number} arg0
    */
    set head(arg0) {
        wasm.__wbg_set_metadata_head(this.ptr, arg0);
    }
}
/**
*/
export class S25 {

    static __wrap(ptr) {
        const obj = Object.create(S25.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_s25_free(ptr);
    }
    /**
    * @param {Uint8Array} array
    * @returns {S25 | undefined}
    */
    static open(array) {
        var ret = wasm.s25_open(addHeapObject(array));
        return ret === 0 ? undefined : S25.__wrap(ret);
    }
    /**
    * @returns {number}
    */
    total_entries() {
        var ret = wasm.__wbg_get_metadata_head(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} entry
    * @returns {boolean}
    */
    exists(entry) {
        var ret = wasm.s25_exists(this.ptr, entry);
        return ret !== 0;
    }
    /**
    * @param {number} entry
    * @returns {Int32Array | undefined}
    */
    get_size(entry) {
        var ret = wasm.s25_get_size(this.ptr, entry);
        return takeObject(ret);
    }
    /**
    * @param {number} entry
    * @returns {Metadata | undefined}
    */
    get_metadata(entry) {
        var ret = wasm.s25_get_metadata(this.ptr, entry);
        return ret === 0 ? undefined : Metadata.__wrap(ret);
    }
    /**
    * @param {number} entry
    * @returns {Uint8Array | undefined}
    */
    decode(entry) {
        var ret = wasm.s25_decode(this.ptr, entry);
        return takeObject(ret);
    }
    /**
    * @param {number} entry
    * @returns {Uint8Array | undefined}
    */
    decode_rgba(entry) {
        var ret = wasm.s25_decode_rgba(this.ptr, entry);
        return takeObject(ret);
    }
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {

        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_buffer_49131c283a06686f = function(arg0) {
        var ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_17b60ac1a19c43e4 = function(arg0, arg1, arg2) {
        var ret = new Int32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_066196c5e92c30d6 = function(arg0) {
        var ret = new Int32Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_c0f38401daad5a22 = function(arg0, arg1, arg2) {
        var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_2b13641a9d906653 = function(arg0) {
        var ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_new_9b295d24cf1d706f = function(arg0) {
        var ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getindex_4293d80bb704736f = function(arg0, arg1) {
        var ret = getObject(arg0)[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_memory = function() {
        var ret = wasm.memory;
        return addHeapObject(ret);
    };

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;

    return wasm;
}

export default init;

