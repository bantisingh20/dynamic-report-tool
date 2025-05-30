-- SELECT * FROM get_table_relations(ARRAY['users', 'orders']);

CREATE OR REPLACE FUNCTION get_table_relations(selected_tables TEXT[])
RETURNS TABLE(
    source_table TEXT, 
    source_column TEXT, 
    target_table TEXT, 
    target_column TEXT,
    column_table TEXT,
    column_name TEXT,
    data_type TEXT
) AS $$
WITH related_tables AS (
  -- Get foreign key relationships between tables
  SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column
  FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = ANY(selected_tables) OR ccu.table_name = ANY(selected_tables))
),
primary_keys AS (
  -- Get primary key columns for the related tables
  SELECT
    tc.table_name,
    kcu.column_name
  FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name = ANY(selected_tables)
),
columns AS (
  -- Get columns (excluding PK and FK) for the related tables
  SELECT 
    table_name,
    column_name,
    data_type
  FROM information_schema.columns
  WHERE table_name = ANY(selected_tables)
)
-- Final SELECT to get results
SELECT
  rt.source_table,
  rt.source_column,
  rt.target_table,
  rt.target_column,
  c.table_name AS column_table,
  c.column_name,
  c.data_type
FROM related_tables rt
JOIN columns c ON c.table_name IN (rt.source_table, rt.target_table)
WHERE NOT EXISTS (
  -- Exclude primary key and foreign key columns
  SELECT 1
  FROM primary_keys pk
  WHERE pk.table_name = c.table_name AND pk.column_name = c.column_name
)
ORDER BY rt.source_table, rt.source_column, rt.target_table, rt.target_column, c.table_name, c.column_name;
$$ LANGUAGE sql;
