SET markup csv ON QUOTE off
SET trimspool ON
SET feedback off

-- QUERY START
SELECT
  referenced_owner,
  name,
  type,
  referenced_name,
  referenced_type
FROM
  all_dependencies
WHERE
  referenced_name IN (
    SELECT
      table_name
    FROM
      dba_tables
    WHERE
      owner IN ('CO', 'HR', 'SH')
  )
  AND referenced_owner IN ('CO', 'HR', 'SH');
-- QUERY END

EXIT
