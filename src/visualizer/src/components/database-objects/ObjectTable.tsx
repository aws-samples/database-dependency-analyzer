import Table, { TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import { useCollection } from "@cloudscape-design/collection-hooks";
import { DatabaseObject } from "../../utils/DataExtractor";
import Box from "@cloudscape-design/components/box";
import Pagination from "@cloudscape-design/components/pagination";
import { useState } from "react";
import CollectionPreferences, {
  CollectionPreferencesProps,
} from "@cloudscape-design/components/collection-preferences";

type Props = {
  databaseObjects: DatabaseObject[] | undefined;
  onObjectSelected: (dbObject: DatabaseObject) => void;
};

export default function ObjectTable(props: Props) {
  const [preferences, setPreferences] =
    useState<CollectionPreferencesProps.Preferences>({
      pageSize: 25,
      visibleContent: ["name", "type", "id"],
    });
  const columnDefinitions: TableProps.ColumnDefinition<DatabaseObject>[] = [
    {
      id: "name",
      header: "Name",
      cell: (item) => <Link href="#">{item?.name}</Link>,
      sortingField: "name",
      isRowHeader: true,
    },
    {
      id: "type",
      header: "Type",
      cell: (item) => item?.type,
      sortingField: "type",
    },
    {
      id: "id",
      header: "Object ID",
      cell: (item) => item?.id,
      sortingField: "id",
    },
    {
      id: "dependencyCount",
      header: "Dependencies",
      cell: (item) => item?.dependencyCount,
      sortingField: "dependencyCount",
    },
  ];

  const { items, actions, collectionProps, filterProps, paginationProps } =
    useCollection(props.databaseObjects || [], {
      filtering: {
        noMatch: (
          <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
              No database objects found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              Please modify your filter criteria
            </Box>
          </Box>
        ),
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: { defaultState: { sortingColumn: columnDefinitions[0] } },
      selection: {},
    });

  return (
    <Table
      {...collectionProps}
      variant="full-page"
      stickyHeader={true}
      stripedRows={true}
      ariaLabels={{
        selectionGroupLabel: "Items selection",
        allItemsSelectionLabel: ({ selectedItems }) =>
          `${selectedItems.length} ${
            selectedItems.length === 1 ? "item" : "items"
          } selected`,
        itemSelectionLabel: (item) => item.selectedItems[0]?.id,
      }}
      columnDefinitions={columnDefinitions}
      columnDisplay={preferences.contentDisplay}
      onRowClick={({ detail }) => {
        actions.setSelectedItems([detail.item]);
        props.onObjectSelected(detail.item);
      }}
      enableKeyboardNavigation
      items={items}
      loading={props.databaseObjects === undefined}
      loadingText="Loading objects"
      trackBy="id"
      selectionType="single"
      contentDensity={preferences.contentDensity}
      onSelectionChange={(event) => {
        props.onObjectSelected(event.detail.selectedItems[0]);
        if (collectionProps.onSelectionChange) {
          collectionProps.onSelectionChange(event);
        }
      }}
      filter={
        <TextFilter {...filterProps} filteringPlaceholder="Filter objects" />
      }
      header={
        <Header counter={"(" + (props.databaseObjects?.length ?? 0) + ")"}>
          Database Objects
        </Header>
      }
      pagination={<Pagination {...paginationProps} />}
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail)}
          pageSizePreference={{
            title: "Page size",
            options: [
              { value: 10, label: "10 objects" },
              { value: 25, label: "25 objects" },
              { value: 50, label: "50 objects" },
              { value: 100, label: "100 objects" },
            ],
          }}
          contentDensityPreference={{}}
          contentDisplayPreference={{
            options: [
              { id: "name", label: "Name", alwaysVisible: true },
              { id: "type", label: "Type" },
              { id: "id", label: "Object ID" },
              { id: "dependencyCount", label: "Dependencies" },
            ],
          }}
        />
      }
    />
  );
}
