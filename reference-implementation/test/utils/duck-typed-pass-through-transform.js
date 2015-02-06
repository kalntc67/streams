export default function duckTypedPassThroughTransform() {
  var enqueueInReadable;
  var closeReadable;

  return {
    writable: new WritableStream({
      write(chunk) {
        enqueueInReadable(chunk);
      },

      close() {
        closeReadable();
      }
    }),

    readable: new ReadableStream({
      start(enqueue, close) {
        enqueueInReadable = enqueue;
        closeReadable = close;
      }
    })
  };
}
