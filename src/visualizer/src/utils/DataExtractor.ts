export interface VisualizationData {
  i: string; // ID
  e: boolean; // Duplicate
  d: VisualizationData[]; // Dependencies
  u: string[] | undefined; // UniqueDependencyIds
}

export class DatabaseObject {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly duplicate: boolean;
  readonly dependencies: DatabaseObject[];
  readonly uniqueDependencyIds: string[] | undefined;
  readonly dependencyCount: number | undefined;

  constructor(data: VisualizationData) {
    this.id = data.i;
    this.name = data.i.split("+")[0];
    const type = data.i.split("+")[1];
    this.type = type.charAt(0).toUpperCase() + type.substring(1).toLowerCase();
    this.duplicate = data.e;
    this.dependencies = data.d.flatMap((dep) => new DatabaseObject(dep));
    this.uniqueDependencyIds = data.u;
    this.dependencyCount = data.u?.length;
  }

  get title(): string {
    return `${this.name} (${this.type})`;
  }
}

export function extractDatabaseObjects(
  data: VisualizationData[],
): DatabaseObject[] {
  return data.map((item) => new DatabaseObject(item));
}
