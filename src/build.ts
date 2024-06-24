import {
  DbObject,
  findUsage,
  readCSV,
  buildNodeSummary,
  DependencyNode,
} from "./utils";
import { createWriteStream, writeFileSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

interface CsvTable {
  TABLE_NAME: string;
}

interface CsvView {
  VIEW_NAME: string;
}

interface CsvParentChild {
  parent: string;
  child: string;
}

interface CsvDependency {
  REFERENCED_OWNER: string;
  NAME: string;
  TYPE: string;
  REFERENCED_NAME: string;
  REFERENCED_TYPE: string;
}

interface CsvTriggerDetail {
  TABLE_NAME: string;
  TRIGGER_NAME: string;
  TRIGGER_TYPE: string;
  TRIGGERING_EVENT: string;
  TRIGGER_BODY: string;
}

const showWarnings = true;
const dbObjects = new Map<string, DbObject>();
const nodeCache = new Map<string, DependencyNode>();

export default async function buildObjectStatistics() {
  // Read CSV files
  const tableNames = (await readCSV("../data/tables.csv")) as CsvTable[];
  console.log(`${tableNames.length} tables read from tables.csv`);
  const viewNames = (await readCSV("../data/views.csv")) as CsvView[];
  console.log(`${viewNames.length} views read from views.csv`);
  const parentChild = (await readCSV(
    "../data/parent_child.csv",
  )) as CsvParentChild[];
  console.log(
    `${parentChild.length} parent-child relationships read from parent_child.csv`,
  );
  const dependencies = (await readCSV(
    "../data/dependencies.csv",
  )) as CsvDependency[];
  console.log(
    `${dependencies.length} object dependencies read from dependencies.csv`,
  );
  const triggerDetails = (await readCSV(
    "../data/trigger_details.csv",
  )) as CsvTriggerDetail[];
  console.log(
    `${triggerDetails.length} triggers with details read from trigger_details.csv`,
  );

  console.log("Processing all data. This may take several minutes...");

  tableNames.forEach((table) => {
    const dbObject = new DbObject(table.TABLE_NAME, "TABLE");
    dbObjects.set(dbObject.id, dbObject);
  });
  viewNames.forEach((view) => {
    const dbObject = new DbObject(view.VIEW_NAME, "VIEW");
    dbObjects.set(dbObject.id, dbObject);
  });
  parentChild.forEach((entry) => {
    if (dbObjects.has(`${entry.parent}+TABLE`)) {
      const dbObject = dbObjects.get(`${entry.parent}+TABLE`);
      if (dbObjects.has(`${entry.child}+TABLE`)) {
        dbObject.tables.add(entry.child);
      } else {
        showWarnings &&
          console.warn("parent_child unhandled child view: ", entry);
      }
    } else if (dbObjects.has(`${entry.parent}+VIEW`)) {
      const dbObject = dbObjects.get(`${entry.parent}+VIEW`);
      if (dbObjects.has(`${entry.child}+TABLE`)) {
        dbObject.tables.add(entry.child);
      } else {
        showWarnings &&
          console.warn("parent_child unhandled child view: ", entry);
      }
    } else {
      showWarnings &&
        console.warn("parent_child table/view not found: ", entry);
    }
  });
  dependencies.forEach((dependency) => {
    dependency.TYPE = normalizeType(dependency.TYPE);
    dependency.REFERENCED_TYPE = normalizeType(dependency.REFERENCED_TYPE);

    const id = `${dependency.NAME}+${dependency.TYPE}`;
    let dbObject: DbObject;
    if (dbObjects.has(id)) {
      dbObject = dbObjects.get(id);
    } else {
      dbObject = new DbObject(dependency.NAME, dependency.TYPE);
      dbObjects.set(id, dbObject);
    }

    if (
      !dbObjects.has(
        `${dependency.REFERENCED_NAME}+${dependency.REFERENCED_TYPE}`,
      )
    ) {
      const referencedObject = new DbObject(
        dependency.REFERENCED_NAME,
        dependency.REFERENCED_TYPE,
      );
      dbObjects.set(referencedObject.id, referencedObject);
    }

    if (dependency.REFERENCED_TYPE === "TABLE") {
      dbObject.tables.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "VIEW") {
      dbObject.views.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "PACKAGE") {
      dbObject.packages.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "TRIGGER") {
      dbObject.triggers.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "FUNCTION") {
      dbObject.functions.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "TYPE") {
      dbObject.types.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "SEQUENCE") {
      dbObject.sequences.add(dependency.REFERENCED_NAME);
    } else if (dependency.REFERENCED_TYPE === "SYNONYM") {
      dbObject.synonyms.add(dependency.REFERENCED_NAME);
    } else {
      showWarnings && console.warn("unsupported reference type", dependency);
    }
  });
  const functionNames = Object.keys(dbObjects).filter((key) =>
    key.endsWith("+FUNCTION"),
  );
  triggerDetails.forEach((triggerDetail) => {
    const id = `${triggerDetail.TRIGGER_NAME}+TRIGGER`;
    let trigger = dbObjects.get(id);
    if (!trigger) {
      trigger = new DbObject(triggerDetail.TRIGGER_NAME, "TRIGGER");
      dbObjects.set(trigger.id, trigger);
    }

    const table = dbObjects.get(`${triggerDetail.TABLE_NAME}+TABLE`);
    if (table) table.triggers.add(triggerDetail.TRIGGER_NAME);

    const view = dbObjects.get(`${triggerDetail.TABLE_NAME}+VIEW`);
    if (view) view.triggers.add(triggerDetail.TRIGGER_NAME);

    if (!view && !table) {
      showWarnings &&
        console.warn(
          "triggerDetails table/view not found: ",
          triggerDetail.TABLE_NAME,
        );
    }
    const upperCaseBody = triggerDetail.TRIGGER_BODY.toUpperCase();
    functionNames.forEach((functionName) => {
      if (upperCaseBody.includes(functionName)) {
        trigger.functions.add(functionName);
      }
    });
  });

  console.log("Finished combining data points");

  const nodes = writeJsonFiles();

  writeCsvFile(nodes);
}

function normalizeType(type: string) {
  if (type === "PROCEDURE") {
    return "FUNCTION";
  } else if (type === "MATERIALIZED VIEW") {
    return "VIEW";
  } else if (type === "PACKAGE BODY") {
    return "PACKAGE";
  } else if (type === "TYPE BODY") {
    return "TYPE";
  } else {
    return type.toUpperCase();
  }
}

function buildNode(id: string, stack: string[] = []): DependencyNode {
  if (nodeCache.has(id)) return nodeCache.get(id)!;

  const dbObject = dbObjects.get(id)!;

  const node = new DependencyNode(dbObject.name, dbObject.type);
  nodeCache.set(id, node);

  stack.push(id);

  dbObject.tables.forEach((table) => {
    // Ignore repeated table
    if (stack.includes(`${table}+TABLE`)) return;
    node.dependencies.push(buildNode(`${table}+TABLE`, stack));
  });
  dbObject.views.forEach((view) => {
    // Ignore repeated view
    if (stack.includes(`${view}+VIEW`)) return;
    node.dependencies.push(buildNode(`${view}+VIEW`, stack));
  });
  dbObject.packages.forEach((pack) => {
    // Ignore repeated package
    if (stack.includes(`${pack}+PACKAGE`)) return;
    node.dependencies.push(buildNode(`${pack}+PACKAGE`, stack));
  });
  dbObject.triggers.forEach((trigger) => {
    // Ignore nested triggers
    if (stack.some((s) => s.includes("TRIGGER"))) return;
    node.dependencies.push(buildNode(`${trigger}+TRIGGER`, stack));
  });
  dbObject.functions.forEach((func) => {
    // Ignore repeated function
    if (stack.includes(`${func}+FUNCTION`)) return;
    node.dependencies.push(buildNode(`${func}+FUNCTION`, stack));
  });
  dbObject.types.forEach((type) => {
    // Ignore repeated type
    if (stack.includes(`${type}+TYPE`)) return;
    node.dependencies.push(buildNode(`${type}+TYPE`, stack));
  });
  dbObject.sequences.forEach((sequence) => {
    // Ignore repeated sequence
    if (stack.includes(`${sequence}+SEQUENCE`)) return;
    node.dependencies.push(buildNode(`${sequence}+SEQUENCE`, stack));
  });
  dbObject.synonyms.forEach((synonym) => {
    // Ignore repeated synonym
    if (stack.includes(`${synonym}+SYNONYM`)) return;
    node.dependencies.push(buildNode(`${synonym}+SYNONYM`, stack));
  });

  stack.pop();

  return node;
}

function writeJsonFiles(): DependencyNode[] {
  console.log("Sorting and writing data to JSON...");

  const nodes: DependencyNode[] = [];

  Array.from(dbObjects.keys()).forEach((id) => {
    nodes.push(buildNode(id));
  });

  nodes.sort((a, b) => (a.name > b.name ? 1 : -1));

  console.log(`Writing ${nodes.length} nodes...`);

  writeGzipJsonArray(
    join(__dirname, "/../data/visualization_data.json.gz"),
    nodes.map((node) => node.toVisualizationJson()),
  );

  writeJsonArray(
    join(__dirname, "/../data/nodes.json"),
    nodes.map((node) => node.toJson()),
  );

  console.log("Finished writing data to JSON");

  return nodes;
}

function writeGzipJsonArray(filename: string, jsonArray: unknown[]) {
  const buffers = [Buffer.from("[")];
  jsonArray.forEach((item, index) => {
    const buf = Buffer.from(JSON.stringify(item));
    buffers.push(buf);
    if (index + 1 < jsonArray.length) {
      buffers.push(Buffer.from(","));
    }
  });
  buffers.push(Buffer.from("]"));

  const finalBuffer = gzipSync(Buffer.concat(buffers));

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(filename, finalBuffer);
}

function writeJsonArray(filename: string, jsonArray: unknown[]) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const writeStream = createWriteStream(filename);
  writeStream.write("[");
  jsonArray.forEach((item: unknown, index: number) => {
    writeStream.write(item);
    if (index + 1 < jsonArray.length) {
      writeStream.write(",");
    }
  });
  writeStream.end("]");
}

function writeCsvFile(nodes: DependencyNode[]) {
  console.log("Building usage stats and writing object statistics to CSV...");

  const headerLabels = [
    "name",
    "type",
    "table dependencies",
    "view dependencies",
    "package dependencies",
    "trigger dependencies",
    "functions/proc dependencies",
    "type dependencies",
    "sequence dependencies",
    "synonym dependencies",
    "table usage",
    "view usage",
    "package usage",
    "trigger usage",
    "functions/proc usage",
    "type usage",
    "sequence usage",
    "synonym usage",
  ];

  let fileContents = `${headerLabels.join(",")}\n`;

  nodes.forEach((node) => {
    const summary = buildNodeSummary(node);
    nodes
      .filter(
        (innerNode) =>
          innerNode.id !== summary.id &&
          innerNode.allDependencyIds.includes(summary.id),
      )
      .forEach((innerNode) => {
        findUsage(summary, innerNode);
      });
    fileContents += summary.rowDetails + "\n";
  });

  writeFileSync(join(__dirname, "/../data/object_stats.csv"), fileContents);
}
