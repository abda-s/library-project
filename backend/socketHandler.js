// backend/socketHandler.js

let ioInstance = null;

const init = (io) => {
  ioInstance = io;
  console.log('Socket.IO handler initialized.');
};

const emitScanStatus = (status, tagId = null) => {
  if (ioInstance) {
    ioInstance.emit('scan_status', { status, tagId });
    console.log(`Emitted scan_status: ${status}` + (tagId ? ` for tag ${tagId}` : ''));
  } else {
    console.warn('Socket.IO not initialized. Cannot emit scan_status.');
  }
};

// Modified emitTagScanned to accept status, data, and error
const emitTagScanned = (status, data, error = null) => {
  if (ioInstance) {
    // Emit the object with status, data, and error fields
    ioInstance.emit('tag_scanned', { status, data, error });
    console.log('Emitted tag_scanned:', { status, data, error });
  } else {
    console.warn('Socket.IO not initialized. Cannot emit tag_scanned.');
  }
};

const emitScanError = (error) => {
  if (ioInstance) {
    ioInstance.emit('scan_error', { error });
    console.error('Emitted scan_error:', error);
  } else {
    console.warn('Socket.IO not initialized. Cannot emit scan_error.');
  }
};

module.exports = {
  init,
  emitScanStatus,
  emitTagScanned,
  emitScanError
};