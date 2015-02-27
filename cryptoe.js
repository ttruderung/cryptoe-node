/**
 * Node.js implementation of cryptoe, a high-level crypto library
 * providing easy interoperability between client- and server-side
 * environments.
 *
 * This is the version of cryptoe for node.js
 *
 * @author Tomasz Truderung
 *
 * Copyright (c) 2015 Tomasz Truderung
 */

var assert = require('assert');
var crypto = require('crypto');

cryptoe = exports;

//////////////////////////////////////////////////////////////////////
// MESSAGE


/**
 * Private constructor of messages. It creates a messaage  by
 * encapsulating an array of bytes (of type Uint8Array). 
 *
 * @param bytes: (buffer) array of bytes 
 *
 * @param end:   (int) specifies size of the buffer (the index
 *               where new data can be written to). 
 *               If end>bytes.length (there is space to write),
 *               then this object owns the underlying buffer.
 *
 * @return a new message object encapsulating 'bytes'
 */
function newMessage(bytes, end) {
    // Variables bytes (Buffer) and end (int) represent the internal
    // state of the created message. 

    if (end===undefined) end = bytes.length;

    // The message object to be returned. All the public methods are
    // added to this object
    var message = {};

    message.reallocationCounter = 0; // for testing 
    
    // PUBLIC METHODS OF THE MESSAGE OBJECT

    /**
     * Returns the length of the message.
     */
    message.len = function() { return end; }

    /**
     * Returns the i-th byte of the message
     */
    message.byteAt = function(n) {
        assert(n>=0 && n<end);
        return bytes[n];
    }

    /**
     * Returns a slice [a,b) of the message. If end is unspecified,
     * message.length() is takes as its default value. The argument end
     * can also have negative values, in which case it is relative to the
     * end of the underlying buffer.
     *
     * Slicing is a light-weight operation and does not involve data
     * copying (the underlying data will be, however, copied once one of
     * the append method is called for the returned message).
     */
    message.slice = function(a, b) {
        if (b===undefined) { b = message.len(); }
        if (b<0) { b = message.len() + b; }
        return newMessage(bytes.slice(a, b), b);
    }

    /**
     * Clones the message. It is a shortcut for slice(0).
     */
    message.clone = function() {
        return message.slice(0);
    }

    /**
     *  Returns the message as an array of bytes (Buffer). The
     *  returned array is a copy of the message representation.
     */
    message.toBytes = function() {
        var array = new Buffer(message.len()); // create a new buffer
        bytes.copy(array, 0, 0, end); // and copy the content of bytes to this array
        return array
    }

    /**
     * Returns a string with the hexadecimal representation of the
     * message.
     */
    message.toHexString = function() {
        return bytes.toString('hex', 0, end);
    }

    /**
     * Returns the base64 representation of the message.
     */
    message.toBase64 = function() {
        return bytes.toString('base64', 0, end);
    }

    /** 
     * Assumes that the message contains a utf-8 encoded string and
     * converts it back to a (native javascript) string. 
     */
    message.toString = function() {
        return bytes.toString('utf8', 0, end);
    }


    // The following methods read some data from the beginning of
    // the message and move the message forward

    /**
     * Takes a 1-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 1 byte forward.
     */
    message.takeByte = function() {
        if (message.len()<1) throw new Error("Message.takeByte: not enought data");
        var value = message.byteAt(0);
        message.skip(1);
        return value;
    }

    /**
     * Takes a 2-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 2 byte forward.
     */
    message.takeInt16 = function() {
        if (message.len()<2) throw new Error("Message.takeInt16: not enought data");
        var value = bytes.readInt16BE(0);
        message.skip(2)
        return value;
    }

    /**
     * Takes a 4-byte signed integer from the beginning of the message,
     * and moves the beginning of the message 4 byte forward.
     */
    message.takeInt32 = function() {
        if (message.len()<4) throw new Error("Message.takeInt32: not enought data");
        var value = bytes.readInt32BE(0);
        message.skip(4);
        return value;
    }

    /**
     * Takes a 2-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 2 byte forward.
     */
    message.takeUint16 = function() {
        if (message.len()<2) throw new Error("Message.takeUInt16: not enought data");
        var value = bytes.readUInt16BE(0); 
        message.skip(2);
        return value;
    }

    /**
     * Takes a 4-byte unsigned integer from the beginning of the message,
     * and moves the beginning of the message 4 byte forward.
     */
    message.takeUint32 = function() {
        if (message.len()<4) throw new Error("Message.takeUint32: not enought data");
        var value = bytes.readUInt32BE(0); 
        message.skip(4);
        return value;
    }

    /**
     * Takes len bytes from the beginning of the messages and returns is
     * as a new message.
     */
    message.takeMessage = function(len) {
        if (message.len()<len) throw new Error("Message.takeMessage: not enought data");
        var value = message.slice(0,len);
        message.skip(len);
        return value;
    }

    /**
     * Skips n bytes (moves the beginning of the messages n bytes forward).
     */
    message.skip = function(n) {
        if (end < n) n = end;

        bytes = bytes.slice(n); 
        end -= n;
    }


    /**
     * Appends a message msg to this message (does a reallocation, if
     * necessary).
     */
    message.appendMessage = function(msg) {
        var oldend = message.len(); // keep the end, the next line will change it
        var l = msg.len();
        enlargeBy(l); 
        for (var i=0; i<l; ++i) {
            bytes[oldend++] = msg.byteAt(i);
        }
    }

    /**
     * Appends a (Node) buffer.
     */
    message.appendBuffer = function(buf) {
        message.appendMessage(newMessage(buf, buf.length));
    }

    /**
     * Appends (an array of) bytes. It accepts anything that
     * has the property bytes.length and can be indexed by bytes[i].
     * Data is copied.
     */
    message.appendBytes = function(bytes) {
        if (bytes.length === undefined) throw new Error('Message.appendBytes: Type error')
        var len = bytes.length;
        for (var i=0; i<len; ++i) {
            message.appendByte(bytes[i]);
        }
    }


    /**
     * Appends a byte (unsigned 8-bit integer).
     */
    message.appendByte = function(b) {
        var oldend = message.len();
        enlargeBy(1); 
        bytes[oldend] = b;
    }

    /**
     * Appends a signed 16-bit integer.
     */
    message.appendInt16 = function(value) {
        var oldend = message.len();
        enlargeBy(2); 
        bytes.writeInt16BE(value, oldend);
    }

    /**
     * Appends an unsigned 16-bit integer.
     */
    message.appendUint16 = function(value) {
        var oldend = message.len();
        enlargeBy(2); 
        bytes.writeUInt16BE(value, oldend);
    }

    /**
     * Appends a signed 32-bit integer.
     */
    message.appendInt32 = function(value) {
        var oldend = message.len();
        enlargeBy(4); 
        bytes.writeInt32BE(value, oldend)
    }

    /**
     * Appends a signed 32-bit integer.
     */
    message.appendUint32 = function(value) {
        var oldend = message.len();
        enlargeBy(4); 
        bytes.writeUInt32BE(value, oldend)
    }

    // PRIVATE METHODS

    // Reallocate the byte array to a buffer of size newBufferSize and set
    // the initial size of the array to newArraySize (the array uses
    // part of the buffer; the buffer provides the underlying data).
    //
    function reallocate(newBufferSize, newArraySize) {
        if (newArraySize < message.len() || newBufferSize < newArraySize ) {
            throw new Error('Message.realocate: wrong size');
        }

        // Allocate a new buffer of size newBufferSize: 
        var newBuffer = new Buffer(newBufferSize);
        // Copy existing data from the old array (bytes) to new array (newBytes):
        bytes.copy(newBuffer, 0, 0, end);
        // Replace the old array by the new one:
        bytes = newBuffer;
        // Set the end 
        end = newArraySize;

        message.reallocationCounter++;
    }

    // Enlarges the byte array 'bytes' by numberOfNewBytes bytes.
    // If necessary, reallocates the data. Always resizes the byte array 'bytes'.
    //
    function enlargeBy(numberOfNewBytes) {
        var newSize = message.len() + numberOfNewBytes;  // new requested size
        if (bytes.length < newSize) // there is not enough space
        { 
            // Reallocate:
            var newBufferSize = newSize*2; // twice as much as we need right now
            reallocate(newBufferSize, newSize);
        }
        else { 
            // Resize only:
            end = newSize;
        }
    }


    // Return the message object
    return message;
}
// END OF MESSAGE


/**
 * Creates a new emtpy message.
 */
cryptoe.emptyMessage = function () {
    // We assume that an empty message is created in order to
    // append some data to it. So we set the initial capacity to
    // some non-zero value
    var initialCapacity = 256;
    var bytes = new Buffer(256);
    return newMessage(bytes, 0);
}

/**
 * Creates a message from an array of bytes. It accepts anything that
 * has the property bytes.length and can be indexed by bytes[i].
 */
cryptoe.messageFromBytes = function(bytes) {
    var len = bytes.length;
    var buf = new Buffer(len);
    for (var i=0; i<len; ++i) {
        buf[i] = bytes[i];
    }
    return newMessage(buf, len);
}

/**
 * Creates a message from a string (in the native javascript encoding). 
 * The returned message is utf-8 encoded.
 */
cryptoe.messageFromString = function (str) {
    var bytes = new Buffer(str, 'utf8');
    return newMessage(bytes, bytes.length);
}

/**
 * Returns a message created from a hex-encoded string.
 */
cryptoe.messageFromHexString = function(str) {
    var bytes = new Buffer(str, 'hex');
    return newMessage(bytes, bytes.length);
}

/**
 * Creates a message from a base64 representation.
 */
cryptoe.messageFromBase64 = function(base64str) {
    var bytes = new Buffer(base64str, 'base64');
    return newMessage(bytes, bytes.length);
}


//////////////////////////////////////////////////////////////////////
// RANDOM

/**
 * Returns a random message of the given length (in bytes).
 */
cryptoe.random = function(length) {
    if (length===undefined) throw new Error('random: no length given');
    var bytes = crypto.randomBytes(length);
    return newMessage(bytes, bytes.length);
}


//////////////////////////////////////////////////////////////////////
// SYMMETRIC-KEY ENCRYPTION

/**
 * Private constructor for symmetic keys. It encapsuates a
 * keyBytes (buffer).
 */
function newSymmetricKey(keyBytes) {
    // the key object to be returned
    var key = { };

    key.encrypt = function (message) {
        // Pick a random IV
        var iv = cryptoe.random(12);
        // Create a cipher
        var cipher = crypto.createCipheriv("id-aes256-GCM", keyBytes, iv.toBytes());
        // Encrypt (iv + raw encrytpion + authentication tag)
        var encrypted = cryptoe.emptyMessage();
        encrypted.appendMessage(iv);
        encrypted.appendBuffer(cipher.update(message.toBytes()));
        encrypted.appendBuffer(cipher.final());
        encrypted.appendBuffer(cipher.getAuthTag());

        return encrypted;
    }

    key.decrypt = function (message) {
        // Take the iv (first 12 bytes of the message)
        var iv = message.takeMessage(12);
        // Take the encrypted message without the authentication tag (16 bytes of the message)
        var encrypted = message.takeMessage(message.len()-16);
        // The rest is the authenticatino tag
        var tag = message;
        // Create a decipher
        var decipher = crypto.createDecipheriv("id-aes256-GCM", keyBytes, iv.toBytes());
        // Set the authentication tag
        decipher.setAuthTag(tag.toBytes());
        // Decrypt
        var dec = cryptoe.emptyMessage();
        dec.appendBuffer(decipher.update(encrypted.toBytes()));
        dec.appendBuffer(decipher.final());

        return dec;
    }

    key.asMessage = function () {
        return newMessage(keyBytes);
    }

    // Return the key (this) object
    return key;
};

/**
 * Generate a new symmetic key. 
 *
 * A symmetric key has, most importantly, mehtods 
 * encrypt(m) and decrypt(m).
 */
cryptoe.generateSymmetricKey = function () {
    var key = cryptoe.random(32);
    return newSymmetricKey(key.toBytes());
}

/**
 * Convert a message to a symmetric key.
 */
cryptoe.symmetricKeyFromMessage = function (message) {
    return newSymmetricKey(message.toBytes());
}



