#!/bin/sh

sqlplus -s system/password@//localhost/sample @/db-sample-schemas-23.3/customer_orders/co_install.sql
sqlplus -s system/password@//localhost/sample @/db-sample-schemas-23.3/human_resources/hr_install.sql
sqlplus -s system/password@//localhost/sample @/db-sample-schemas-23.3/sales_history/sh_install.sql
