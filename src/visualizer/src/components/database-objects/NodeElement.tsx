import { TreeNodeDatum } from "react-d3-tree";

type Props = {
  nodeDatum: TreeNodeDatum;
  toggleNode: () => void;
};

export default function NodeElement({ nodeDatum, toggleNode }: Props) {
  return (
    <>
      <circle
        r={20}
        onClick={toggleNode}
        data-dupe={nodeDatum.attributes!.dupe}
      ></circle>
      <g className="rd3t-label" transform="translate(-20,0)">
        <text className="rd3t-label__title" y={40}>
          {nodeDatum.name}
        </text>
        <text className="rd3t-label__attributes" y={40}>
          <tspan dy={"1.2em"}>Type: {nodeDatum.attributes!.type}</tspan>
        </text>
      </g>
    </>
  );
}
