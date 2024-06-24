import { createReadStream } from "fs";
import { join } from "path";
import { createParseStream } from "big-json";
import {
  buildNodeSummary,
  DependencyNode,
  findUsage,
  NodeSummary,
} from "./utils";

const nodeCache = new Map<string, DependencyNode>();

export default async function displayUsages(object: string, type: string) {
  let nodes: DependencyNode[];

  try {
    console.log("Reading all nodes. This make take a few moments...");
    nodes = await readNodes();
    console.log(`${nodes.length} nodes loaded!`);
  } catch (error) {
    console.log("Failed to find usages", error);
  }

  console.log("Processing request...");
  processNodes(object, type, nodes);
}

async function readNodes(): Promise<DependencyNode[]> {
  return new Promise((resolve, reject) => {
    const nodes: DependencyNode[] = [];

    const readStream = createReadStream(join(__dirname, "/../data/nodes.json"));
    const parseStream = createParseStream()
      .on("error", (error) => reject(error))
      .on("data", (items: DependencyNode[]) => {
        items.forEach((item) => nodes.push(buildDependencyNode(item)));
      })
      .on("end", () => {
        resolve(nodes);
      });
    readStream.pipe(parseStream as unknown as NodeJS.WritableStream);
  });
}

function buildDependencyNode(node: DependencyNode): DependencyNode {
  if (nodeCache.has(node.id)) return nodeCache.get(node.id)!;

  const depNode = new DependencyNode(node.name, node.type);
  nodeCache.set(node.id, depNode);

  depNode.dependencies.push(
    ...node.dependencies.map((dep) => buildDependencyNode(dep)),
  );

  return depNode;
}

function processNodes(object: string, type: string, nodes: DependencyNode[]) {
  const id = type ? `${object}+${type}` : object;
  const foundNodes = nodes.filter((node) => node.id.startsWith(id));

  if (foundNodes.length === 0) {
    console.warn(
      `No objects found starting with ${object}${type ? " with type " + type : ""}`,
    );
    return;
  }

  console.log(
    `Found ${foundNodes.length} matching node(s). This may take a few moments to find usages...`,
  );

  const nodeSummaries: NodeSummary[] = [];
  foundNodes.forEach((foundNode) => {
    const summary = buildNodeSummary(foundNode);
    nodes.forEach((innerNode) => {
      if (
        innerNode.id !== summary.id &&
        innerNode.allDependencyIds.includes(summary.id)
      ) {
        findUsage(summary, innerNode);
      }
    });
    nodeSummaries.push(summary);
  });

  nodeSummaries.forEach((summary) => {
    console.log(
      `******************************* START ${summary.id} *******************************`,
    );
    console.log(
      `TABLES(${summary.up.tables.size}):    ` +
        [...Array.from(summary.up.tables)].join(", "),
    );
    console.log(
      `VIEWS(${summary.up.views.size}):     ` +
        [...Array.from(summary.up.views)].join(", "),
    );
    console.log(
      `PACKAGES(${summary.up.packages.size}):  ` +
        [...Array.from(summary.up.packages)].join(", "),
    );
    console.log(
      `TRIGGERS(${summary.up.triggers.size}):  ` +
        [...Array.from(summary.up.triggers)].join(", "),
    );
    console.log(
      `FUNCTIONS(${summary.up.functions.size}): ` +
        [...Array.from(summary.up.functions)].join(", "),
    );
    console.log(
      `TYPES(${summary.up.types.size}):     ` +
        [...Array.from(summary.up.types)].join(", "),
    );
    console.log(
      `SEQUENCES(${summary.up.sequences.size}): ` +
        [...Array.from(summary.up.sequences)].join(", "),
    );
    console.log(
      `SYNONYMS(${summary.up.synonyms.size}):  ` +
        [...Array.from(summary.up.synonyms)].join(", "),
    );
    console.log(
      `******************************* END ${summary.id} *******************************`,
    );
  });
}
