
CREATE OR REPLACE FUNCTION alias_columns(fields TEXT[])
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  f TEXT;
  t TEXT;
  c TEXT;
  alias TEXT;
BEGIN
  FOREACH f IN ARRAY fields LOOP
    t := split_part(f, '.', 1);
    c := split_part(f, '.', 2);
    alias := format('%I - %I', t, c);  -- e.g., users - id
    IF result <> '' THEN
      result := result || ', ';
    END IF;
    result := result || format('%I.%I AS "%s"', t, c, alias);  -- double-quoted alias
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;




-- -- Helper to convert array of fields into aliased SELECT columns
-- CREATE OR REPLACE FUNCTION alias_columns(fields TEXT[])
-- RETURNS TEXT AS $$
-- DECLARE
--   result TEXT := '';
--   f TEXT;
--   t TEXT;
--   c TEXT;
-- BEGIN
--   FOREACH f IN ARRAY fields LOOP
--     t := split_part(f, '.', 1);
--     c := split_part(f, '.', 2);
--     IF result <> '' THEN
--       result := result || ', ';
--     END IF;
--     result := result || format('%I.%I AS %L', t, c, t || ' - ' || c);
--   END LOOP;
--   RETURN result;
-- END;
-- $$ LANGUAGE plpgsql;