#!/bin/sh

# Execute queries to get all dependencies
docker exec -it oracle_sample /bin/bash -c "sqlplus -s system/password@//localhost/sample @/query-scripts/dependencies.sql" > ./data/dependencies.csv
docker exec -it oracle_sample /bin/bash -c "sqlplus -s system/password@//localhost/sample @/query-scripts/views.sql" > ./data/views.csv
docker exec -it oracle_sample /bin/bash -c "sqlplus -s system/password@//localhost/sample @/query-scripts/tables.sql" > ./data/tables.csv
docker exec -it oracle_sample /bin/bash -c "sqlplus -s system/password@//localhost/sample @/query-scripts/trigger_details.sql" > ./data/trigger_details.csv
docker exec -it oracle_sample /bin/bash -c "sqlplus -s system/password@//localhost/sample @/query-scripts/parent_child.sql" > ./data/parent_child.csv

# Remove empty lines from the sqlplus output
sed -i '' '/^[[:space:]]*$/d' ./data/dependencies.csv
sed -i '' '/^[[:space:]]*$/d' ./data/views.csv
sed -i '' '/^[[:space:]]*$/d' ./data/tables.csv
sed -i '' '/^[[:space:]]*$/d' ./data/trigger_details.csv
sed -i '' '/^[[:space:]]*$/d' ./data/parent_child.csv

# Fix trigger_details.csv missing closing quotation on trigger_body
sed -i '' -E 's/^END(.*);/END\1;"/gI' data/trigger_details.csv

echo "All queries executed!"
