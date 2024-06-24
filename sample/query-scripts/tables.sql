SET markup csv ON quote off
SET trimspool ON
SET feedback off

-- QUERY START
SELECT
  table_name
FROM
  all_tables
WHERE
  owner IN ('CO', 'HR', 'SH');
-- QUERY END

EXIT
