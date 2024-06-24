import { SplitPanel } from "@cloudscape-design/components";
import { useState, useEffect, useMemo } from "react";
import { DatabaseObject } from "../../utils/DataExtractor";
import ObjectDependencyGraph from "./ObjectDependencyGraph";
import ObjectTable from "./ObjectTable";
import DdaAppLayout from "../common/DdaAppLayout";

export default function DatabaseObjects() {
  const splitPanelTopSpacing = 179; // size - 63 (header) - 3x20 (margins) - 56 (header)
  const [databaseObjects, setDatabaseObjects] = useState<
    DatabaseObject[] | undefined
  >();
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<
    DatabaseObject | undefined
  >();
  const [splitPanelSize, setSplitPanelSize] = useState(0);
  const [windowResizing, setWindowResizing] = useState(false);

  const databaseObjectParser = useMemo(
    () =>
      new Worker(
        new URL("../../workers/parse-database-objects.ts", import.meta.url),
      ),
    [],
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    const handleResize = () => {
      clearTimeout(timeout);
      setWindowResizing(true);

      timeout = setTimeout(() => {
        setWindowResizing(false);
      }, 200);
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("./visualization_data.json.gz");
        if (!response.ok) {
          throw new Error(`HTTP error: Status ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (window.Worker) {
          databaseObjectParser.postMessage(arrayBuffer);
        }
      } catch (err) {
        console.error("Failed to fetch visualization_data", err);
      }
    };

    if (window.Worker) {
      databaseObjectParser.onmessage = (
        event: MessageEvent<DatabaseObject[]>,
      ) => {
        setDatabaseObjects(
          event.data.map((dbObject) =>
            // Ensure the event data gets the prototype for the DatabaseObject
            Object.setPrototypeOf(dbObject, DatabaseObject.prototype),
          ),
        );
      };
    }

    fetchData();
  }, [databaseObjectParser]);

  const updateSplitPanelSize = () => {
    const sections = document.querySelectorAll(
      'section[class^="awsui_split-panel-bottom"]',
    );
    if (sections.length === 0) {
      return;
    }
    // NOTE: Without a setTimeout, this code doesn't properly resize the graph
    setTimeout(() => {
      const splitViewDrawerDivs = sections[0].querySelectorAll(
        'div[class*="awsui_drawer"]',
      );
      if (splitViewDrawerDivs.length === 0) {
        return;
      }
      const splitViewHeight =
        splitViewDrawerDivs[0].getBoundingClientRect().height;

      setSplitPanelSize(splitViewHeight - splitPanelTopSpacing);
    });
  };

  return (
    <DdaAppLayout
      contentType="table"
      content={
        <ObjectTable
          databaseObjects={databaseObjects}
          onObjectSelected={(dbObject) => {
            setSelectedObject(dbObject);
            if (dbObject) {
              const firstOpen = !splitPanelOpen;
              setSplitPanelOpen(true);

              // If panel isn't already open, we need to update the
              // SplitPanelSize so the graph fits properly
              if (firstOpen) {
                updateSplitPanelSize();
              }
            }
          }}
        />
      }
      splitPanelOpen={splitPanelOpen}
      onSplitPanelToggle={(event) => setSplitPanelOpen(event.detail.open)}
      onSplitPanelResize={(event) =>
        setSplitPanelSize(event.detail.size - splitPanelTopSpacing)
      }
      splitPanel={
        <SplitPanel
          header={selectedObject?.title ?? "No Object Selected"}
          hidePreferencesButton={true}
          closeBehavior="hide"
        >
          {selectedObject ? (
            <ObjectDependencyGraph
              databaseObject={selectedObject}
              splitPanelSize={splitPanelSize}
              windowResizing={windowResizing}
            />
          ) : (
            "Select an object to view its details"
          )}
        </SplitPanel>
      }
    />
  );
}
