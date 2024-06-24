/* eslint-disable no-restricted-globals */

import { inflate } from "pako";
import {
  VisualizationData,
  extractDatabaseObjects,
} from "../utils/DataExtractor";

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  const byteArray = inflate(event.data);
  const jsonData = JSON.parse(new TextDecoder().decode(byteArray));
  const databaseObjects = extractDatabaseObjects(
    jsonData as VisualizationData[],
  );
  self.postMessage(databaseObjects);
};
