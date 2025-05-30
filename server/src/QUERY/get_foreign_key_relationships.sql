-- SELECT * FROM get_foreign_key_relationships(ARRAY['users', 'orders']);

CREATE OR REPLACE FUNCTION get_foreign_key_relationships(table_names TEXT[])
RETURNS TABLE(
    source_table TEXT, 
    source_column TEXT, 
    target_table TEXT, 
    target_column TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.table_name ::TEXT AS source_table ,
    kcu.column_name ::TEXT AS source_column,
    ccu.table_name ::TEXT AS target_table,
    ccu.column_name ::TEXT AS target_column
  FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name 
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name 
      AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = ANY(table_names) OR ccu.table_name = ANY(table_names));
END;
$$ LANGUAGE plpgsql;
