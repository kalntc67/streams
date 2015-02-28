import { Operation, OperationStatus, readableAcceptsReadAndCancel } from './operation-stream';

export class ReadableOperationStream {
  // Public members and internal methods.

  _initReadablePromise() {
    this._readablePromise = new Promise((resolve, reject) => {
      this._resolveReadablePromise = resolve;
    });
  }

  constructor(source, f) {
    this._source = source;

    this._state = 'waiting';

    this._initReadablePromise();

    this._erroredPromise = new Promise((resolve, reject) => {
      this._resolveErroredPromise = resolve;
    });

    this._abortOperation = undefined;

    this._window = 0;

    this._reader = undefined;

    const delegate = {
      markWaiting: this._markWaiting.bind(this),
      markReadable: this._markReadable.bind(this),
      markDrained: this._markDrained.bind(this),
      markAborted: this._markAborted.bind(this)
    };

    f(delegate);
  }

  _throwIfLocked() {
    if (this._reader !== undefined) {
      throw new TypeError('locked');
    }
  }

  get state() {
    this._throwIfLocked();
    return this._state;
  }
  get readable() {
    this._throwIfLocked();
    return this._readablePromise;
  }
  get errored() {
    this._throwIfLocked();
    return this._erroredPromise;
  }

  get _abortOperationIgnoringLock() {
    if (this._state !== 'aborted') {
      throw new TypeError('not aborted');
    }
    return this._abortOperation;
  }
  get abortOperation() {
    this._throwIfLocked();
    return this._abortOperationIgnoringLock;
  }

  _checkState() {
    if (!readableAcceptsReadAndCancel(this._state)) {
      throw new TypeError('already ' + this._state);
    }
  }

  get _windowIgnoringLock() {
    return this._window;
  }
  get window() {
    this._throwIfLocked();
    return this._windowIgnoringLock;
  }

  set _windowIgnoringLock(v) {
    this._checkState();

    this._window = v;

    this._source.onWindowUpdate(v);
  }
  set window(v) {
    this._throwIfLocked();
    this._windowIgnoringLock = v;
  }

  _readOperationIgnoringLock() {
    this._checkState();
    return this._source.readOperation();
  }
  readOperation() {
    this._throwIfLocked();
    return this._readOperationIgnoringLock();
  }
  read() {
    const op = this.readOperation();
    if (op.type === 'data') {
      return op.argument;
    } else if (op.type === 'close') {
      return ReadableOperationStream.EOS;
    } else {
      // error
    }
  }

  _cancelIgnoringLock(reason) {
    this._checkState();

    const operationStatus = new OperationStatus();
    const operation = new Operation('cancel', reason, operationStatus);

    this._source.cancel(operation);

    if (this._reader !== undefined) {
      this._reader._resolveErroredPromise();
    } else {
      this._resolveErroredPromise();
    }

    this._state = 'cancelled';

    return operationStatus;
  }
  cancel(reason) {
    this._throwIfLocked();
    return this._cancelIgnoringLock(reason);
  }

  getReader() {
    this._throwIfLocked();
    this._reader = new ExclusiveOperationStreamWriter(this);
    return this._reader;
  }

  // Methods exposed only to the underlying source.

  _markWaiting() {
    if (this._reader === undefined) {
      this._initReadablePromise();
    } else {
      this._reader._initReadablePromise();
    }

    this._state = 'waiting';
  }

  _markReadable() {
    if (this._state !== 'waiting') {
      return;
    }

    if (this._reader === undefined) {
      this._resolveReadablePromise();
    } else {
      this._reader._resolveReadablePromise();
    }

    this._state = 'readable';
  }

  _markDrained() {
    this._state = 'drained';
  }

  _markAborted(operation) {
    if (this._reader === undefined) {
      this._resolveErroredPromise();
    } else {
      this._writer._resolveErroredPromise();
    }

    this._state = 'aborted';

    this._abortOperation = operation;
  }
}

ReadableOperationStream.EOS = {};