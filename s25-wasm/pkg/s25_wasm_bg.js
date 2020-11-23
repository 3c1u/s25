import * as wasm from './s25_wasm_bg.wasm';

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

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

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
    * @param {Int8Array} array
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
        var ret = wasm.s25_total_entries(this.ptr);
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
    * @returns {Int8Array | undefined}
    */
    decode(entry) {
        var ret = wasm.s25_decode(this.ptr, entry);
        return takeObject(ret);
    }
}

export const __wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};

export const __wbg_buffer_49131c283a06686f = function(arg0) {
    var ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export const __wbg_newwithbyteoffsetandlength_8b2cc58f355e5fdf = function(arg0, arg1, arg2) {
    var ret = new Int8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export const __wbg_length_ef6029cdbb2cf7da = function(arg0) {
    var ret = getObject(arg0).length;
    return ret;
};

export const __wbg_new_7d947369a94000d3 = function(arg0) {
    var ret = new Int8Array(getObject(arg0));
    return addHeapObject(ret);
};

export const __wbg_getindex_18e0810523d75d5a = function(arg0, arg1) {
    var ret = getObject(arg0)[arg1 >>> 0];
    return ret;
};

export const __wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export const __wbindgen_memory = function() {
    var ret = wasm.memory;
    return addHeapObject(ret);
};

