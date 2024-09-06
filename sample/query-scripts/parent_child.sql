SET markup csv ON QUOTE off
SET trimspool ON
SET feedback off

-- QUERY START
SELECT DISTINCT
  b.table_name "parent",
  a.table_name "child"
FROM
  all_constraints a,
  all_constraints b,
  all_cons_columns c,
  all_cons_columns d
WHERE
  a.r_constraint_name=b.constraint_name
  AND a.constraint_type='R'
  AND b.constraint_type IN ('P', 'U')
  AND a.r_owner IN ('CO', 'HR', 'SH')
  AND a.constraint_name=c.constraint_name
  AND b.constraint_name=d.constraint_name
  AND a.owner IN ('CO', 'HR', 'SH')
  AND a.table_name=c.table_name
  AND b.owner IN ('CO', 'HR', 'SH')
  AND b.table_name=d.table_name
  AND a.status='ENABLED'
ORDER BY
  b.table_name;
-- QUERY END

EXIT
