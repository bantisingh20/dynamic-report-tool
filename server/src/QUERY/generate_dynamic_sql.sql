/*
SELECT generate_dynamic_sql(
  '{
    "tables": ["categories","products"],
    "selection": ["categories.name","products.name", "products.stock","products.price","products.description"],
	 "filters": [
    { "field": "products.stock", "operator": ">", "value": "5" },
    { "field": "products.stock", "operator": "<", "value": "500" }
  ],
  "sortBy": [
    { "column": "products.stock", "order": "DESC" } 
  ],
  "groupBy": [{"field": "categories.name"}, {"field": "products.stock"}],
  "xyaxis":[],
  "xyaxisw": [
    {
      "x": {
        "field": "categories.name",
        "order": "ASC"
         
      },
      "y": {
        "field": "products.stock",
        "aggregation": "sum"
      }
    }
  ]
  }'::jsonb
);

*/ 

CREATE OR REPLACE FUNCTION generate_dynamic_sql(config jsonb)
RETURNS text AS $$
DECLARE
    tables TEXT[] := ARRAY(SELECT jsonb_array_elements_text(config->'tables'));
    selection TEXT[] := ARRAY(SELECT jsonb_array_elements_text(config->'selection'));
	groupby_fields TEXT[] := ARRAY(SELECT (elem->>'field') FROM jsonb_array_elements(config->'groupBy') elem);
    base_table TEXT := tables[1];
    other_table TEXT;
    join_sql TEXT := '';
    where_sql TEXT := '';
    order_sql TEXT := '';
    group_sql TEXT := '';
    select_sql TEXT := '';
    result_sql TEXT := '';
	additional_fields TEXT[];
	f TEXT;
	--groupby
	   subquery_select TEXT;
    outer_select TEXT; 
     
    -- XY axis logic
    x_field TEXT;
    x_trans TEXT;
    x_expr TEXT;
    y_field TEXT;
    y_agg TEXT;
    y_expr TEXT;

    -- Filter & sort helpers
    filter jsonb;
    sort jsonb;
    xy jsonb;
    filter_clauses TEXT[] := '{}';
    order_clauses TEXT[] := '{}';
    final_sql TEXT;
   
BEGIN
    -- JOIN logic (same as before) array_to_string(selection, ', ')
    select_sql := 'SELECT ' || alias_columns(selection) || ' FROM ' || base_table;

    FOR i IN 2 .. array_length(tables, 1) LOOP
        other_table := tables[i];

        SELECT INTO join_sql join_sql || format(
            ' JOIN %I ON %I.%I = %I.%I',
            other_table,
            fk.foreign_table, fk.foreign_column,
            fk.primary_table, fk.primary_column
        )
        FROM (
            SELECT
                tc.table_name AS foreign_table,
                kcu.column_name AS foreign_column,
                ccu.table_name AS primary_table,
                ccu.column_name AS primary_column
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_name = kcu.table_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
            WHERE
                tc.constraint_type = 'FOREIGN KEY'
                AND (
                    (tc.table_name = base_table AND ccu.table_name = other_table)
                    OR
                    (tc.table_name = other_table AND ccu.table_name = base_table)
                )
            LIMIT 1
        ) AS fk;
    END LOOP;

    -- WHERE clause
    FOR filter IN SELECT * FROM jsonb_array_elements(config->'filters') LOOP
        filter_clauses := array_append(
            filter_clauses,
            format('%s %s %L',
                filter->>'field',
                filter->>'operator',
                filter->>'value'
            )
        );
    END LOOP;
    IF array_length(filter_clauses, 1) > 0 THEN
        where_sql := ' WHERE ' || array_to_string(filter_clauses, ' AND ');
    END IF;

    -- ORDER BY clause
    FOR sort IN SELECT * FROM jsonb_array_elements(config->'sortBy') LOOP
        order_clauses := array_append(
            order_clauses,
            format('%s %s',
                sort->>'column',
                sort->>'order'
            )
        );
    END LOOP;

    -- Handle xyaxis (only first one)
    IF jsonb_array_length(config->'xyaxis') > 0 THEN
        xy := (config->'xyaxis'->0);  -- First axis only

        x_field := xy->'x'->>'field';
        x_trans := COALESCE(xy->'x'->>'transformation', 'raw');

        IF x_trans = 'date_trunc' THEN
            x_expr := format('date_trunc(''day'', %s)', x_field);
        ELSE
            x_expr := x_field;
        END IF;

        y_field := xy->'y'->>'field';
        y_agg := COALESCE(xy->'y'->>'aggregation', 'count');
        y_expr := format('%s(%s)', UPPER(y_agg), y_field);

        select_sql := format('SELECT %s AS x, %s AS y FROM %I', x_expr, y_expr, base_table);
        group_sql := ' GROUP BY ' || x_expr;

        -- Override order if xy.x.order is given
        IF xy->'x' ? 'order' THEN
            order_sql := format(' ORDER BY x %s', xy->'x'->>'order');
        END IF;
    END IF;
    -- If groupBy exists and non-empty, build group by subquery
    IF array_length(groupby_fields, 1) IS NOT NULL AND array_length(groupby_fields, 1) > 0 THEN

        -- Get selection fields that are NOT in groupBy fields
        SELECT ARRAY(
            SELECT unnest(selection)
            EXCEPT
            SELECT unnest(groupby_fields)
        ) INTO additional_fields;

        -- Build subquery select list: groupBy fields + additional selected fields
        subquery_select := alias_columns(array_cat(groupby_fields, additional_fields));

        -- Build outer select: DISTINCT groupBy fields + additional fields from subquery array_to_string(groupby_fields, ', ')
        outer_select := 'SELECT DISTINCT ' || alias_names(groupby_fields);
         FOREACH f IN ARRAY additional_fields LOOP
		-- yaha pr mene column name table.col format me pass kiya hai but and sub query se use sabse pehle table name
		--split kar raha hai  split_part(f, '.', 1) and use ke next query se mujhe col name mil raha hai 
   			outer_select := outer_select || format(', sub."%s - %s"', split_part(f, '.', 1), split_part(f, '.', 2));
		END LOOP;

        final_sql := outer_select || ' FROM (SELECT ' || subquery_select || ' FROM ' || base_table || join_sql || where_sql || ') AS sub';

    ELSE
        -- No groupBy - normal query just selecting requested columns
        final_sql := 'SELECT ' || alias_columns(selection) || ' FROM ' || base_table || join_sql || where_sql;
    END IF;

    RETURN final_sql || ';';
	
    -- Final SQL
   -- result_sql := select_sql || join_sql || where_sql || group_sql || order_sql || ';';
   -- RETURN result_sql;
END;
$$ LANGUAGE plpgsql;