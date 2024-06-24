SET markup csv ON quote off
SET trimspool ON
SET feedback off

-- QUERY START
SELECT
  view_name
FROM
  all_views
WHERE
  owner IN ('CO', 'HR', 'SH');
-- QUERY END

EXIT
