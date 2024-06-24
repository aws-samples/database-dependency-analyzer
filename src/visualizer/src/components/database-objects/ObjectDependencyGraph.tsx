import { useEffect, useState } from "react";
import Tree, { RawNodeDatum, TreeNodeDatum } from "react-d3-tree";
import { HierarchyPointNode } from "d3-hierarchy";
import Button from "@cloudscape-design/components/button";
import NodeElement from "./NodeElement";
import { DatabaseObject } from "../../utils/DataExtractor";
import styled from "styled-components";
import * as awsui from "@cloudscape-design/design-tokens";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Toggle from "@cloudscape-design/components/toggle";
import { useAppSettings } from "../../utils/AppSettings";

const TreeContainer = styled.div`
  border: 1px solid;
  border-color: ${awsui.colorBorderDividerDefault};
  border-radius: ${awsui.borderRadiusContainer};

  .rd3t-node > circle {
    fill: ${awsui.colorChartsStatusNeutral};
    stroke: ${awsui.colorChartsThresholdNeutral};
  }

  .rd3t-leaf-node > circle[data-dupe="false"] {
    fill: ${awsui.colorChartsStatusInfo};
    stroke: ${awsui.colorChartsThresholdNeutral};
  }

  .rd3t-leaf-node > circle[data-dupe="true"] {
    fill: ${awsui.colorChartsStatusMedium};
    stroke: ${awsui.colorChartsThresholdNeutral};
  }

  .rd3t-label__title {
    fill: ${awsui.colorTextBodyDefault};
  }

  .rd3t-label__attributes {
    fill: ${awsui.colorTextBodySecondary};
  }

  .rd3t-label {
    user-select: none;
  }

  .rd3t-link {
    stroke: ${awsui.colorChartsThresholdNeutral};
  }
`;

const Legend = styled(SpaceBetween)`
  margin-top: -30px;
  margin-left: 15px;
`;

const LegendItem = styled.div<{ color: string }>`
  background-color: ${awsui.colorBackgroundLayoutMain};
  padding-left: 2px;
  padding-right: 2px;
  border-radius: 4px;
  border: 1px solid transparent;
  display: flex;

  span {
    display: flex;
    margin-top: 3px;
    margin-right: 4px;
    inline-size: 14px;
    block-size: 14px;
    border-radius: 2px;
    background-color: ${(props) => props.color};
  }
`;

type Props = {
  databaseObject: DatabaseObject;
  splitPanelSize: number;
  windowResizing: boolean;
};

export default function ObjectDependencyGraph(props: Props) {
  const minTreeContainerHeight = 380;
  let tree: Tree | null = null;
  let treeContainer: HTMLDivElement | null = null;

  const appSettingsWrapper = useAppSettings();
  const appSettings = appSettingsWrapper.value;
  const [graphData, setGraphData] = useState<RawNodeDatum | undefined>();
  const [dimensions, setDimensions] = useState<DOMRect | undefined>();
  const [toggleAllObjects, setToggleAllObjects] = useState<boolean>(false);
  const [treeContainerHeight, setTreeContainerHeight] = useState<number>(
    Math.max(minTreeContainerHeight, props.splitPanelSize),
  );

  useEffect(() => {
    setTreeContainerHeight(
      Math.max(minTreeContainerHeight, props.splitPanelSize),
    );
  }, [props.splitPanelSize]);

  useEffect(() => {
    setDimensions(treeContainer?.getBoundingClientRect());
  }, [treeContainerHeight, treeContainer]);

  // Reset the translation for the graph on change of object
  useEffect(() => {
    resetTranslation(tree);
    setToggleAllObjects(false);
    setGraphData(buildGraphData(props.databaseObject));
  }, [props.databaseObject, tree]);

  useEffect(() => {
    // Once resizing is done, reset graph view and container dimensions
    if (!props.windowResizing) {
      setDimensions(treeContainer?.getBoundingClientRect());
      resetTranslation(tree);
    }
  }, [props.windowResizing, tree, treeContainer]);

  const traverseTree = (
    node: TreeNodeDatum,
    fn: (datum: TreeNodeDatum) => void,
  ) => {
    fn(node);
    node.children?.forEach((n) => traverseTree(n, fn));
  };

  const onToggleAllObjects = (toggled: boolean) => {
    setToggleAllObjects(toggled);
    if (toggled) {
      // Expand all nodes
      traverseTree(tree!.state.data[0], (datum) => {
        datum.__rd3t.collapsed = false;
      });
    } else {
      // Only expand first node, collapse all others
      traverseTree(tree!.state.data[0], (datum) => {
        if (datum.__rd3t.depth > 0) {
          datum.__rd3t.collapsed = true;
        }
      });
    }
  };

  // On first render, center the root node
  setTimeout(() => resetTranslation(tree), 0);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        description="Select an object below to expand/collapse its dependencies. Pan the graph to move around, and use the scroll wheel to zoom in/out."
        actions={
          <SpaceBetween direction="horizontal" size="xs" alignItems="center">
            <Toggle
              onChange={({ detail }) => onToggleAllObjects(detail.checked)}
              checked={toggleAllObjects}
            >
              Toggle all objects
            </Toggle>
            <Button variant="primary" onClick={() => resetTranslation(tree)}>
              Reset view
            </Button>
          </SpaceBetween>
        }
      >
        Object Dependency Diagram
      </Header>
      <TreeContainer
        ref={(tc) => (treeContainer = tc)}
        style={{ width: "100%", height: `${treeContainerHeight}px` }}
      >
        {graphData && (
          <Tree
            ref={(ref) => (tree = ref)}
            data={graphData}
            nodeSize={{
              x: appSettings.compactModeEnabled ? 220 : 300,
              y: appSettings.compactModeEnabled ? 80 : 100,
            }}
            translate={{ x: 200, y: 200 }}
            collapsible={true}
            hasInteractiveNodes={true}
            shouldCollapseNeighborNodes={true}
            dimensions={dimensions}
            initialDepth={1}
            centeringTransitionDuration={300}
            renderCustomNodeElement={(nodeProps) => (
              <NodeElement
                nodeDatum={nodeProps.nodeDatum}
                toggleNode={nodeProps.toggleNode}
              />
            )}
          />
        )}
        <Legend direction="horizontal" size="m">
          <LegendItem color={awsui.colorChartsStatusNeutral}>
            <span />
            Object with dependencies
          </LegendItem>
          <LegendItem color={awsui.colorChartsStatusMedium}>
            <span />
            Object with dependencies (duplicate)
          </LegendItem>
          <LegendItem color={awsui.colorChartsStatusInfo}>
            <span />
            Object with no dependencies
          </LegendItem>
        </Legend>
      </TreeContainer>
    </SpaceBetween>
  );
}

function buildGraphData(node: DatabaseObject): RawNodeDatum {
  return {
    name: node.name,
    attributes: {
      type: node.type,
      dupe: node.duplicate,
    },
    children: node.dependencies.map((dependency) => buildGraphData(dependency)),
  };
}

function resetTranslation(tree: Tree | null) {
  tree?.centerNode({
    x: 0,
    y: 0,
  } as HierarchyPointNode<TreeNodeDatum>);
}
