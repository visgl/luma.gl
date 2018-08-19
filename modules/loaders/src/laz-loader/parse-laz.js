// ported and es6-ified from https://github.com/verma/plasio/
import {LASFile} from './laslaz';

/**
 * parse laz data
 * @param {Binary} data
 * @return {*} parsed point cloud
 */
export function parseLAZ(rawData, skip, onParseData) {
  const dataHandler = new LASFile(rawData);
  return (
    dataHandler
      .open()
      // open data
      .then(() => {
        dataHandler.isOpen = true;
        return dataHandler;
      })
      // attch header
      .then(data => data.getHeader().then(header => [data, header]))
      // start loading
      .then(([data, header]) => {
        const Unpacker = data.getUnpacker();

        const totalToRead = header.pointsCount / Math.max(1, skip);
        let totalRead = 0;

        const reader = () =>
          data.readData(1000 * 100, 0, skip).then(chunk => {
            totalRead += chunk.count;
            const unpacker = new Unpacker(chunk.buffer, chunk.count, header);
            // surface unpacker and progress via call back
            // use unpacker.pointsCount and unpacker.getPoint(i) to handle data in app
            onParseData(unpacker, totalRead / totalToRead);

            if (chunk.hasMoreData && totalRead < totalToRead) {
              return reader();
            }

            header.totalRead = totalRead;
            header.versionAsString = chunk.versionAsString;
            header.isCompressed = chunk.isCompressed;
            return [chunk, header];
          });

        return reader();
      })
      // done loading, close file
      .then(([data, header]) => {
        dataHandler.close().then(() => {
          dataHandler.isOpen = false;
          // trim the LASFile which we don't really want to pass to the user
          return header;
        });
      })
      // handle exceptions
      .catch(e => {
        // make sure the data is closed, if the data is open close and then fail
        if (dataHandler.isOpen) {
          return dataHandler.close().then(() => {
            dataHandler.isOpen = false;
            throw e;
          });
        }
        throw e;
      })
  );
}
