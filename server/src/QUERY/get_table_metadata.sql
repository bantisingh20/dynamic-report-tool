--   SELECT * FROM get_table_metadata();

CREATE OR REPLACE FUNCTION get_table_metadata()
RETURNS TABLE(name TEXT, type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT table_name::TEXT, table_type::TEXT
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type != 'VIEW';
END;
$$ LANGUAGE plpgsql;
