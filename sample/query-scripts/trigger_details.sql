SET markup csv ON
SET trimspool ON
SET feedback off
SET LONG 100000

-- QUERY START
SELECT
  table_name,
  trigger_name,
  trigger_type,
  triggering_event,
  trigger_body
FROM
  all_triggers
WHERE
  owner IN ('CO', 'HR', 'SH')
ORDER BY
  1;
-- QUERY END

EXIT
