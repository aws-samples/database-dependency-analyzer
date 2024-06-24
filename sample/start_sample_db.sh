#!/bin/sh

echo "Downloading sample Oracle schema..."

rm -r db-sample-schemas-23.3
curl -L https://github.com/oracle-samples/db-sample-schemas/archive/refs/tags/v23.3.zip > sample-schemas.zip
unzip sample-schemas.zip
rm sample-schemas.zip

echo "Download completed!"

echo "Modifying scripts for automation..."

# Modify co_install.sql
sed -i '' -e "s/ACCEPT pass PROMPT.*/def pass = 'password'/g" db-sample-schemas-23.3/customer_orders/co_install.sql
sed -i '' -e "s/ACCEPT tbs PROMPT.*/def tbs = 'USERS'/g" db-sample-schemas-23.3/customer_orders/co_install.sql
sed -i '' -e "s/ACCEPT overwrite_schema PROMPT.*/def overwrite_schema = 'YES'/g" db-sample-schemas-23.3/customer_orders/co_install.sql

# Modify hr_install.sql
sed -i '' -e "s/ACCEPT pass PROMPT.*/def pass = 'password'/g" db-sample-schemas-23.3/human_resources/hr_install.sql
sed -i '' -e "s/ACCEPT tbs PROMPT.*/def tbs = 'USERS'/g" db-sample-schemas-23.3/human_resources/hr_install.sql
sed -i '' -e "s/ACCEPT overwrite_schema PROMPT.*/def overwrite_schema = 'YES'/g" db-sample-schemas-23.3/human_resources/hr_install.sql

# Modify sh_install.sql
sed -i '' -e "s/ACCEPT pass PROMPT.*/def pass = 'password'/g" db-sample-schemas-23.3/sales_history/sh_install.sql
sed -i '' -e "s/ACCEPT tbs PROMPT.*/def tbs = 'USERS'/g" db-sample-schemas-23.3/sales_history/sh_install.sql
sed -i '' -e "s/ACCEPT overwrite_schema PROMPT.*/def overwrite_schema = 'YES'/g" db-sample-schemas-23.3/sales_history/sh_install.sql

# Fix for sh_populate script issue
sed -i '' -e "s/INDEXTYPE IS ctxsys.context PARAMETERS('nopopulate');/--INDEXTYPE IS ctxsys.context PARAMETERS('nopopulate');/g" db-sample-schemas-23.3/sales_history/sh_populate.sql

echo "Scripts modified!"

echo "Starting Docker Container..."

docker compose up --force-recreate
