import { performance } from "perf_hooks";
import { Command } from "commander";
import buildObjectStatistics from "./build";
import displayUsages from "./usages";

const program = new Command();

program
  .name("db-dependencies")
  .description("CLI to work with database object dependencies")
  .version("1.0.0");

program
  .command("build")
  .description(
    "Builds the database object statistics CSV output file and associated data JSON file",
  )
  .action(async () => {
    await time(buildObjectStatistics);
  });

program
  .command("usages <object> [type]")
  .description(
    'Display all of the usages of a given database object with optional type (supports "object+type" format)',
  )
  .action((object: string, type: string) => {
    if (object.includes("+")) {
      [object, type] = object.split("+");
    }
    time(displayUsages, object.toUpperCase(), type?.toUpperCase());
  });

program.parse();

// eslint-disable-next-line @typescript-eslint/ban-types
async function time(func: Function, ...args: string[]) {
  const startTime = performance.now();
  await func(...args);
  const endTime = performance.now();
  console.log(`Completed in ${Math.round(endTime - startTime)} milliseconds`);
}
