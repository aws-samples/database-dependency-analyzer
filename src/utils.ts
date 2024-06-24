import { createReadStream } from "fs";
import path from "path";
import { parse } from "fast-csv";

const nodeSummaryCache = new Map<string, NodeSummary>();

// Uses single character members for smaller file output size
export interface VisualizationNode {
  i: string; // ID
  e: boolean; // Duplicate
  d: VisualizationNode[]; // Dependencies
  u: string[] | undefined; // UniqueDependencyIds
}

export class DbObject {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly tables: Set<string>;
  readonly views: Set<string>;
  readonly packages: Set<string>;
  readonly triggers: Set<string>;
  readonly functions: Set<string>;
  readonly types: Set<string>;
  readonly sequences: Set<string>;
  readonly synonyms: Set<string>;

  constructor(name, type) {
    this.id = `${name}+${type}`;
    this.name = name;
    this.type = type;
    this.tables = new Set();
    this.views = new Set();
    this.packages = new Set();
    this.triggers = new Set();
    this.functions = new Set();
    this.types = new Set();
    this.sequences = new Set();
    this.synonyms = new Set();
  }
}

export class NodeSummary {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly up: DbObject;
  readonly down: DbObject;

  constructor(node) {
    this.id = node.id;
    this.name = node.name;
    this.type = node.type;
    this.up = {
      id: "",
      name: "",
      type: "",
      tables: new Set(),
      views: new Set(),
      packages: new Set(),
      triggers: new Set(),
      functions: new Set(),
      types: new Set(),
      sequences: new Set(),
      synonyms: new Set(),
    };
    this.down = {
      id: "",
      name: "",
      type: "",
      tables: new Set(),
      views: new Set(),
      packages: new Set(),
      triggers: new Set(),
      functions: new Set(),
      types: new Set(),
      sequences: new Set(),
      synonyms: new Set(),
    };
  }

  get rowDetails() {
    return [
      this.name,
      this.type,
      this.down.tables.size,
      this.down.views.size,
      this.down.packages.size,
      this.down.triggers.size,
      this.down.functions.size,
      this.down.types.size,
      this.down.sequences.size,
      this.down.synonyms.size,
      this.up.tables.size,
      this.up.views.size,
      this.up.packages.size,
      this.up.triggers.size,
      this.up.functions.size,
      this.up.types.size,
      this.up.sequences.size,
      this.up.synonyms.size,
    ].join(",");
  }
}

export class DependencyNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly dependencies: DependencyNode[];
  readonly allDependencyIdsCache: string[];

  constructor(name: string, type: string) {
    this.id = `${name}+${type}`;
    this.name = name;
    this.type = type;
    this.dependencies = [];
    this.allDependencyIdsCache = [];
  }

  buildAllDependencyIds(node) {
    return [
      node.id,
      ...node.dependencies.flatMap((n) => this.buildAllDependencyIds(n)),
    ];
  }

  get allDependencyIds() {
    if (!this.allDependencyIdsCache.length) {
      this.allDependencyIdsCache.push(...this.buildAllDependencyIds(this));
    }
    return this.allDependencyIdsCache;
  }

  toVisualizationJson(
    firstNode = true,
    nodeCache = new Map<string, VisualizationNode>(),
  ): VisualizationNode {
    if (nodeCache.has(this.id)) {
      // Return a shallow copy of the object, marking it as a dupe with no dependencies
      return {
        ...nodeCache.get(this.id),
        e: this.dependencies.length > 0,
        d: [],
      };
    }

    const node = {
      i: this.id, // id
      e: false, // dupe
      d: this.dependencies.map((dependency) =>
        dependency.toVisualizationJson(false, nodeCache),
      ), // dependencies
    } as VisualizationNode;

    if (firstNode) {
      node.u = [...this.getUniqueDependencyIds()].filter(
        (id) => id !== this.id,
      );
    }

    nodeCache.set(this.id, node);

    return node;
  }

  toJsonHelper(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      dependencies: node.dependencies.map((n) => this.toJsonHelper(n)),
    };
  }

  getUniqueDependencyIds(ids: Set<string> = new Set<string>()): Set<string> {
    if (ids.has(this.id)) return ids;

    ids.add(this.id);
    this.dependencies.forEach((dep) => dep.getUniqueDependencyIds(ids));
    return ids;
  }

  toJson() {
    return JSON.stringify(this.toJsonHelper(this));
  }
}

export async function readCSV(filename: string) {
  return new Promise((resolve, reject) => {
    const data: unknown[] = [];
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    createReadStream(path.join(__dirname, filename))
      .pipe(parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data));
  });
}

export function buildNodeSummary(node: DependencyNode): NodeSummary {
  if (nodeSummaryCache.has(node.id)) return nodeSummaryCache.get(node.id)!;

  const nodeSummary = new NodeSummary(node);
  nodeSummaryCache.set(node.id, nodeSummary);

  // Calculate dependency counts
  node.dependencies.forEach((dependency) => {
    const summary = buildNodeSummary(dependency);

    if (dependency.type === "TABLE") {
      nodeSummary.down.tables.add(dependency.name);
    } else if (dependency.type === "VIEW") {
      nodeSummary.down.views.add(dependency.name);
    } else if (dependency.type === "PACKAGE") {
      nodeSummary.down.packages.add(dependency.name);
    } else if (dependency.type === "TRIGGER") {
      nodeSummary.down.triggers.add(dependency.name);
    } else if (dependency.type === "FUNCTION") {
      nodeSummary.down.functions.add(dependency.name);
    } else if (dependency.type === "TYPE") {
      nodeSummary.down.types.add(dependency.name);
    } else if (dependency.type === "SEQUENCE") {
      nodeSummary.down.sequences.add(dependency.name);
    } else if (dependency.type === "SYNONYM") {
      nodeSummary.down.synonyms.add(dependency.name);
    }

    summary.down.tables.forEach((item) => nodeSummary.down.tables.add(item));
    summary.down.views.forEach((item) => nodeSummary.down.views.add(item));
    summary.down.packages.forEach((item) =>
      nodeSummary.down.packages.add(item),
    );
    summary.down.triggers.forEach((item) =>
      nodeSummary.down.triggers.add(item),
    );
    summary.down.functions.forEach((item) =>
      nodeSummary.down.functions.add(item),
    );
    summary.down.types.forEach((item) => nodeSummary.down.types.add(item));
    summary.down.sequences.forEach((item) =>
      nodeSummary.down.sequences.add(item),
    );
    summary.down.synonyms.forEach((item) =>
      nodeSummary.down.synonyms.add(item),
    );
  });

  return nodeSummary;
}

export function findUsage(nodeSummary, node) {
  node.dependencies.forEach((dependency) => {
    if (dependency.id === nodeSummary.id) {
      if (node.type === "TABLE") {
        nodeSummary.up.tables.add(node.name);
      } else if (node.type === "VIEW") {
        nodeSummary.up.views.add(node.name);
      } else if (node.type === "PACKAGE") {
        nodeSummary.up.packages.add(node.name);
      } else if (node.type === "TRIGGER") {
        nodeSummary.up.triggers.add(node.name);
      } else if (node.type === "FUNCTION") {
        nodeSummary.up.functions.add(node.name);
      } else if (node.type === "TYPE") {
        nodeSummary.up.types.add(node.name);
      } else if (node.type === "SEQUENCE") {
        nodeSummary.up.sequences.add(node.name);
      } else if (node.type === "SYNONYM") {
        nodeSummary.up.synonyms.add(node.name);
      }
    }
    findUsage(nodeSummary, dependency);
  });
}
