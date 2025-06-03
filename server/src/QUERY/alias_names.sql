CREATE OR REPLACE FUNCTION alias_names(fields TEXT[])
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  f TEXT;
  t TEXT;
  c TEXT;
BEGIN
  FOREACH f IN ARRAY fields LOOP
    t := split_part(f, '.', 1);
    c := split_part(f, '.', 2);
    IF result <> '' THEN
      result := result || ', ';
    END IF;
    result := result || format('"%s - %s"', t, c);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
