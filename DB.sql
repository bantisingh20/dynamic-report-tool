PGDMP      (                }            test    17.4    17.4 Y    J           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            K           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            L           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            M           1262    16654    test    DATABASE        CREATE DATABASE test WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
    DROP DATABASE test;
                     postgres    false                       1255    16821 9   dynamic_query_proc(refcursor, text, text[], jsonb, jsonb) 	   PROCEDURE     �	  CREATE PROCEDURE public.dynamic_query_proc(INOUT ref refcursor, IN p_table text, IN p_selection text[] DEFAULT NULL::text[], IN p_filters jsonb DEFAULT '[]'::jsonb, IN p_sort_by jsonb DEFAULT '[]'::jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_sql TEXT;
    v_cols TEXT;
    v_filtered_cols TEXT[];
BEGIN
    -- Get non-PK/FK columns
    SELECT array_agg(column_name)
    INTO v_filtered_cols
    FROM information_schema.columns
    WHERE table_name = p_table
    AND column_name NOT IN (
        SELECT column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = p_table
        AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
        UNION
        SELECT ccu.column_name
        FROM information_schema.constraint_column_usage ccu
        JOIN information_schema.referential_constraints rc
            ON ccu.constraint_name = rc.unique_constraint_name
        WHERE ccu.table_name = p_table
    );

    -- Filter selection
    IF p_selection IS NOT NULL AND array_length(p_selection, 1) > 0 THEN
        v_filtered_cols := ARRAY(
            SELECT unnest(p_selection)
            INTERSECT
            SELECT unnest(v_filtered_cols)
        );
    END IF;

    -- Build SELECT clause
    v_cols := COALESCE(array_to_string(v_filtered_cols, ', '), '*');
    v_sql := format('SELECT %s FROM %I', v_cols, p_table);

    -- WHERE clause
    IF jsonb_array_length(p_filters) > 0 THEN
        v_sql := v_sql || ' WHERE ';
        FOR i IN 0 .. jsonb_array_length(p_filters) - 1 LOOP
            v_sql := v_sql || format(
                '(%I %s %L)',
                p_filters->i->>'field',
                p_filters->i->>'operator',
                p_filters->i->>'value'
            );
            IF i < jsonb_array_length(p_filters) - 1 THEN
                v_sql := v_sql || ' AND ';
            END IF;
        END LOOP;
    END IF;

    -- ORDER BY clause
    IF jsonb_array_length(p_sort_by) > 0 THEN
        v_sql := v_sql || ' ORDER BY ';
        FOR i IN 0 .. jsonb_array_length(p_sort_by) - 1 LOOP
            v_sql := v_sql || format(
                '%I %s',
                p_sort_by->i->>'column',
                p_sort_by->i->>'order'
            );
            IF i < jsonb_array_length(p_sort_by) - 1 THEN
                v_sql := v_sql || ', ';
            END IF;
        END LOOP;
    END IF;

    -- Open the dynamic SQL as cursor
    OPEN ref FOR EXECUTE v_sql;
END;
$$;
 �   DROP PROCEDURE public.dynamic_query_proc(INOUT ref refcursor, IN p_table text, IN p_selection text[], IN p_filters jsonb, IN p_sort_by jsonb);
       public               postgres    false                       1255    16851    execute_dynamic_query(json)    FUNCTION     �  CREATE FUNCTION public.execute_dynamic_query(config json) RETURNS SETOF record
    LANGUAGE plpgsql
    AS $$
DECLARE
    tables TEXT[];
    selection TEXT[];
    sql TEXT := '';
    where_clause TEXT := '';
    order_clause TEXT := '';
    i INT;
BEGIN
    -- Extract tables and columns
    SELECT ARRAY(SELECT json_array_elements_text(config->'table')) INTO tables;
    SELECT ARRAY(SELECT json_array_elements_text(config->'selection')) INTO selection;

    -- Build SELECT clause
    sql := 'SELECT ' || array_to_string(selection, ', ') || ' FROM ' || tables[1];

    -- Add JOINs if multiple tables
    IF array_length(tables, 1) > 1 THEN
        FOR i IN 2 .. array_length(tables, 1) LOOP
            sql := sql || ' JOIN ' || tables[i] || ' ON ' || tables[1] || '.id = ' || tables[i] || '.' || tables[1] || '_id';
        END LOOP;
    END IF;

    -- Filters (WHERE)
    -- Filters (WHERE)
IF config->'filters' IS NOT NULL AND json_typeof(config->'filters') = 'array' AND json_array_length(config->'filters') > 0 THEN

        DECLARE
            f JSON;
            field TEXT;
            operator TEXT;
            val TEXT;
            valFrom TEXT;
            valTo TEXT;
            condition TEXT;
            conditions TEXT := '';
        BEGIN
            FOR f IN SELECT * FROM json_array_elements(config->'filters') LOOP
                field := f->>'field';
                operator := f->>'operator';
                val := f->>'value';
                valFrom := f->>'valueFrom';
                valTo := f->>'valueTo';

                IF operator = 'between' THEN
                    condition := format('%I BETWEEN %L AND %L', field, valFrom, valTo);
                ELSE
                    condition := format('%I %s %L', field, operator, val);
                END IF;

                IF conditions != '' THEN
                    conditions := conditions || ' AND ';
                END IF;
                conditions := conditions || condition;
            END LOOP;

            sql := sql || ' WHERE ' || conditions;
        END;
    END IF;

    -- SortBy
    IF config->'sortBy' IS NOT NULL AND json_typeof(config->'sortBy') = 'array' AND json_array_length(config->'sortBy') > 0 THEN

        DECLARE
            s JSON;
        BEGIN
            FOR i IN 0 .. json_array_length(config->'sortBy') - 1 LOOP
                s := config->'sortBy' -> i;
                IF order_clause != '' THEN
                    order_clause := order_clause || ', ';
                END IF;
                order_clause := order_clause || format('%I %s', s->>'column', UPPER(s->>'order'));
            END LOOP;
        END;
    END IF;

    -- xyaxis sort
    IF config->'xyaxis' IS NOT NULL AND json_typeof(config->'xyaxis') = 'array' AND json_array_length(config->'xyaxis') > 0 THEN

        DECLARE
            x JSON;
            xfield TEXT;
            xdir TEXT;
            yfield TEXT;
            ydir TEXT;
        BEGIN
            FOR i IN 0 .. json_array_length(config->'xyaxis') - 1 LOOP
                x := config->'xyaxis' -> i;
                xfield := x->'x'->>'field';
                xdir := x->'x'->>'order';
                yfield := x->'y'->>'field';
                ydir := x->'y'->>'order';

                IF order_clause != '' THEN
                    order_clause := order_clause || ', ';
                END IF;
                order_clause := order_clause || format('%I %s, %I %s', xfield, UPPER(xdir), yfield, UPPER(ydir));
            END LOOP;
        END;
    END IF;

    -- Final ORDER BY
    IF order_clause != '' THEN
        sql := sql || ' ORDER BY ' || order_clause;
    END IF;

    -- Log query for debugging
    RAISE NOTICE 'Executing SQL: %', sql;

    -- Execute and return dynamic result
    RETURN QUERY EXECUTE sql;

END;
$$;
 9   DROP FUNCTION public.execute_dynamic_query(config json);
       public               postgres    false                       1255    16844    get_columns_for_tables(text[])    FUNCTION     �  CREATE FUNCTION public.get_columns_for_tables(tables text[]) RETURNS TABLE(table_name text, column_name text, data_type text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.table_name::text, c.column_name::text,c.data_type::text
    FROM information_schema.columns c
    WHERE c.table_name = ANY(tables)  -- Match table names from input
      AND c.column_name NOT IN (
          -- Exclude Primary Key columns
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_name = kcu.table_name
          WHERE tc.table_name = c.table_name
            AND tc.constraint_type = 'PRIMARY KEY'

          UNION

          -- Exclude Foreign Key columns
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_name = kcu.table_name
          WHERE tc.table_name = c.table_name
            AND tc.constraint_type = 'FOREIGN KEY'
      )
    ORDER BY c.table_name, c.ordinal_position;
END;
$$;
 <   DROP FUNCTION public.get_columns_for_tables(tables text[]);
       public               postgres    false                       1255    16829    get_table_relationships(text)    FUNCTION     �  CREATE FUNCTION public.get_table_relationships(start_table text) RETURNS TABLE(table_name text, relation_type text, related_to text, depth integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE fk_hierarchy AS (
        -- Base case: start from the given table
        SELECT distinct
            tc.table_name::text AS table_name,
            'base'::text AS relation_type,
            NULL::text COLLATE "C" AS related_to,
            0 AS depth
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = start_table
          AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')

        UNION ALL

        -- Recursive step: find tables that reference the current table
        SELECT 
            kcu.table_name::text AS table_name,
            'references'::text AS relation_type,
            ccu.table_name::text COLLATE "C" AS related_to,
            fh.depth + 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.constraint_schema = kcu.constraint_schema
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.constraint_schema = ccu.constraint_schema
        JOIN fk_hierarchy fh
            ON ccu.table_name = fh.table_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    )
    SELECT * FROM fk_hierarchy;
END;
$$;
 @   DROP FUNCTION public.get_table_relationships(start_table text);
       public               postgres    false            �            1255    16762    list_tables_and_views()    FUNCTION     y  CREATE FUNCTION public.list_tables_and_views() RETURNS TABLE(name text, type text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT table_name::TEXT, 'table' AS type FROM information_schema.tables 
    WHERE table_schema = 'public'
    UNION
    SELECT table_name::TEXT, 'view' AS type FROM information_schema.views 
    WHERE table_schema = 'public';
END;
$$;
 .   DROP FUNCTION public.list_tables_and_views();
       public               postgres    false            �            1259    16666 
   categories    TABLE     ]   CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100)
);
    DROP TABLE public.categories;
       public         heap r       postgres    false            �            1259    16665    categories_id_seq    SEQUENCE     �   CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.categories_id_seq;
       public               postgres    false    222            N           0    0    categories_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
          public               postgres    false    221            �            1259    16689 	   customers    TABLE       CREATE TABLE public.customers (
    id integer NOT NULL,
    user_id integer,
    first_name character varying(100),
    last_name character varying(100),
    email character varying(100),
    shipping_address text,
    phone_number character varying(20)
);
    DROP TABLE public.customers;
       public         heap r       postgres    false            �            1259    16717    order_items    TABLE     �   CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer,
    price numeric(10,2)
);
    DROP TABLE public.order_items;
       public         heap r       postgres    false            �            1259    16703    orders    TABLE     �  CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_id integer,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20),
    total_amount numeric(10,2),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'canceled'::character varying])::text[])))
);
    DROP TABLE public.orders;
       public         heap r       postgres    false            �            1259    16675    products    TABLE     �   CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255),
    category_id integer,
    price numeric(10,2),
    description text,
    stock_quantity integer,
    image_url text
);
    DROP TABLE public.products;
       public         heap r       postgres    false            �            1259    16776    customer_order_history    VIEW     5  CREATE VIEW public.customer_order_history AS
 SELECT (((c.first_name)::text || ' '::text) || (c.last_name)::text) AS customer_name,
    c.email AS customer_email,
    o.id AS order_id,
    o.order_date,
    o.total_amount,
    p.name AS product_name,
    oi.quantity,
    oi.price AS product_price,
    ((oi.quantity)::numeric * oi.price) AS total_product_amount
   FROM (((public.customers c
     JOIN public.orders o ON ((c.id = o.customer_id)))
     JOIN public.order_items oi ON ((o.id = oi.order_id)))
     JOIN public.products p ON ((oi.product_id = p.id)));
 )   DROP VIEW public.customer_order_history;
       public       v       postgres    false    230    230    230    230    228    228    228    228    226    226    226    226    224    224            �            1259    16688    customers_id_seq    SEQUENCE     �   CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.customers_id_seq;
       public               postgres    false    226            O           0    0    customers_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;
          public               postgres    false    225            �            1259    16748 	   inventory    TABLE     �   CREATE TABLE public.inventory (
    id integer NOT NULL,
    product_id integer,
    quantity_in_stock integer,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.inventory;
       public         heap r       postgres    false            �            1259    16747    inventory_id_seq    SEQUENCE     �   CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.inventory_id_seq;
       public               postgres    false    234            P           0    0    inventory_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;
          public               postgres    false    233            �            1259    16790    order_items_detail    VIEW     �  CREATE VIEW public.order_items_detail AS
 SELECT o.id AS order_id,
    o.order_date,
    o.status AS order_status,
    p.name AS product_name,
    oi.quantity,
    oi.price AS product_price,
    ((oi.quantity)::numeric * oi.price) AS total_product_amount
   FROM ((public.orders o
     JOIN public.order_items oi ON ((o.id = oi.order_id)))
     JOIN public.products p ON ((oi.product_id = p.id)));
 %   DROP VIEW public.order_items_detail;
       public       v       postgres    false    228    230    230    230    228    230    224    224    228            �            1259    16716    order_items_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.order_items_id_seq;
       public               postgres    false    230            Q           0    0    order_items_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;
          public               postgres    false    229            �            1259    16734    payments    TABLE     �  CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer,
    payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_method character varying(50),
    amount numeric(10,2),
    status character varying(20),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying])::text[])))
);
    DROP TABLE public.payments;
       public         heap r       postgres    false            �            1259    16767    order_summary    VIEW     �  CREATE VIEW public.order_summary AS
 SELECT o.id AS order_id,
    o.order_date,
    o.status AS order_status,
    o.total_amount,
    (((c.first_name)::text || ' '::text) || (c.last_name)::text) AS customer_name,
    c.email AS customer_email,
    c.phone_number AS customer_phone,
    p.payment_method,
    p.status AS payment_status,
    p.amount AS payment_amount
   FROM ((public.orders o
     JOIN public.customers c ON ((o.customer_id = c.id)))
     LEFT JOIN public.payments p ON ((o.id = p.order_id)));
     DROP VIEW public.order_summary;
       public       v       postgres    false    226    226    226    226    228    228    228    228    228    232    232    232    232    226            �            1259    16702    orders_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.orders_id_seq;
       public               postgres    false    228            R           0    0    orders_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;
          public               postgres    false    227            �            1259    16786    payment_details    VIEW       CREATE VIEW public.payment_details AS
 SELECT o.id AS order_id,
    o.total_amount AS order_total,
    p.payment_method,
    p.amount AS payment_amount,
    p.payment_date,
    p.status AS payment_status
   FROM (public.orders o
     JOIN public.payments p ON ((o.id = p.order_id)));
 "   DROP VIEW public.payment_details;
       public       v       postgres    false    232    232    232    228    228    232    232            �            1259    16733    payments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.payments_id_seq;
       public               postgres    false    232            S           0    0    payments_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;
          public               postgres    false    231            �            1259    16763    product_details    VIEW       CREATE VIEW public.product_details AS
 SELECT p.id AS product_id,
    p.name AS product_name,
    c.name AS category_name,
    p.price,
    p.stock_quantity,
    p.image_url
   FROM (public.products p
     JOIN public.categories c ON ((p.category_id = c.id)));
 "   DROP VIEW public.product_details;
       public       v       postgres    false    222    224    224    224    224    224    224    222            �            1259    16772    product_inventory    VIEW       CREATE VIEW public.product_inventory AS
 SELECT p.name AS product_name,
    c.name AS category_name,
    p.price,
    i.quantity_in_stock
   FROM ((public.products p
     JOIN public.categories c ON ((p.category_id = c.id)))
     JOIN public.inventory i ON ((p.id = i.product_id)));
 $   DROP VIEW public.product_inventory;
       public       v       postgres    false    222    224    224    224    234    234    222    224            �            1259    16674    products_id_seq    SEQUENCE     �   CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.products_id_seq;
       public               postgres    false    224            T           0    0    products_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
          public               postgres    false    223            �            1259    16810    report_configuration    TABLE     �  CREATE TABLE public.report_configuration (
    report_id integer NOT NULL,
    user_id integer NOT NULL,
    report_name character varying(500) NOT NULL,
    table_name character varying(255) NOT NULL,
    selected_columns text[],
    filter_criteria jsonb,
    group_by text[],
    sort_order text[],
    axis_config jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 (   DROP TABLE public.report_configuration;
       public         heap r       postgres    false            �            1259    16809 "   report_configuration_report_id_seq    SEQUENCE     �   CREATE SEQUENCE public.report_configuration_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.report_configuration_report_id_seq;
       public               postgres    false    244            U           0    0 "   report_configuration_report_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.report_configuration_report_id_seq OWNED BY public.report_configuration.report_id;
          public               postgres    false    243            �            1259    16781    sales_by_category    VIEW     ]  CREATE VIEW public.sales_by_category AS
 SELECT c.name AS category_name,
    sum(((oi.quantity)::numeric * oi.price)) AS total_sales_amount,
    sum(oi.quantity) AS total_items_sold
   FROM ((public.categories c
     JOIN public.products p ON ((c.id = p.category_id)))
     JOIN public.order_items oi ON ((p.id = oi.product_id)))
  GROUP BY c.name;
 $   DROP VIEW public.sales_by_category;
       public       v       postgres    false    230    224    222    222    224    230    230            �            1259    16795    top_selling_products    VIEW       CREATE VIEW public.top_selling_products AS
 SELECT p.name AS product_name,
    sum(oi.quantity) AS total_quantity_sold
   FROM (public.products p
     JOIN public.order_items oi ON ((p.id = oi.product_id)))
  GROUP BY p.name
  ORDER BY (sum(oi.quantity)) DESC
 LIMIT 10;
 '   DROP VIEW public.top_selling_products;
       public       v       postgres    false    230    224    224    230            �            1259    16656    users    TABLE     ,  CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100),
    password character varying(255),
    role character varying(20),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'customer'::character varying])::text[])))
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    16655    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    220            V           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    219            q           2604    16669    categories id    DEFAULT     n   ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
 <   ALTER TABLE public.categories ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            s           2604    16692    customers id    DEFAULT     l   ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);
 ;   ALTER TABLE public.customers ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225    226            y           2604    16751    inventory id    DEFAULT     l   ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);
 ;   ALTER TABLE public.inventory ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233    234            v           2604    16720    order_items id    DEFAULT     p   ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
 =   ALTER TABLE public.order_items ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    229    230    230            t           2604    16706 	   orders id    DEFAULT     f   ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
 8   ALTER TABLE public.orders ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227    228            w           2604    16737    payments id    DEFAULT     j   ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);
 :   ALTER TABLE public.payments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    231    232    232            r           2604    16678    products id    DEFAULT     j   ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
 :   ALTER TABLE public.products ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    223    224    224            {           2604    16813    report_configuration report_id    DEFAULT     �   ALTER TABLE ONLY public.report_configuration ALTER COLUMN report_id SET DEFAULT nextval('public.report_configuration_report_id_seq'::regclass);
 M   ALTER TABLE public.report_configuration ALTER COLUMN report_id DROP DEFAULT;
       public               postgres    false    243    244    244            p           2604    16659    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    220    220            9          0    16666 
   categories 
   TABLE DATA           .   COPY public.categories (id, name) FROM stdin;
    public               postgres    false    222   �       =          0    16689 	   customers 
   TABLE DATA           n   COPY public.customers (id, user_id, first_name, last_name, email, shipping_address, phone_number) FROM stdin;
    public               postgres    false    226   ��       E          0    16748 	   inventory 
   TABLE DATA           T   COPY public.inventory (id, product_id, quantity_in_stock, last_updated) FROM stdin;
    public               postgres    false    234   ��       A          0    16717    order_items 
   TABLE DATA           P   COPY public.order_items (id, order_id, product_id, quantity, price) FROM stdin;
    public               postgres    false    230   ��       ?          0    16703    orders 
   TABLE DATA           S   COPY public.orders (id, customer_id, order_date, status, total_amount) FROM stdin;
    public               postgres    false    228   ��       C          0    16734    payments 
   TABLE DATA           ^   COPY public.payments (id, order_id, payment_date, payment_method, amount, status) FROM stdin;
    public               postgres    false    232   v�       ;          0    16675    products 
   TABLE DATA           h   COPY public.products (id, name, category_id, price, description, stock_quantity, image_url) FROM stdin;
    public               postgres    false    224   �      G          0    16810    report_configuration 
   TABLE DATA           �   COPY public.report_configuration (report_id, user_id, report_name, table_name, selected_columns, filter_criteria, group_by, sort_order, axis_config, created_at) FROM stdin;
    public               postgres    false    244   ?      7          0    16656    users 
   TABLE DATA           =   COPY public.users (id, username, password, role) FROM stdin;
    public               postgres    false    220   A      W           0    0    categories_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.categories_id_seq', 10, true);
          public               postgres    false    221            X           0    0    customers_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.customers_id_seq', 500, true);
          public               postgres    false    225            Y           0    0    inventory_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.inventory_id_seq', 100, true);
          public               postgres    false    233            Z           0    0    order_items_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.order_items_id_seq', 1500, true);
          public               postgres    false    229            [           0    0    orders_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.orders_id_seq', 500, true);
          public               postgres    false    227            \           0    0    payments_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.payments_id_seq', 500, true);
          public               postgres    false    231            ]           0    0    products_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.products_id_seq', 100, true);
          public               postgres    false    223            ^           0    0 "   report_configuration_report_id_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.report_configuration_report_id_seq', 22, true);
          public               postgres    false    243            _           0    0    users_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.users_id_seq', 500, true);
          public               postgres    false    219            �           2606    16673    categories categories_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);
 H   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_name_key;
       public                 postgres    false    222            �           2606    16671    categories categories_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
       public                 postgres    false    222            �           2606    16696    customers customers_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_pkey;
       public                 postgres    false    226            �           2606    16754    inventory inventory_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.inventory DROP CONSTRAINT inventory_pkey;
       public                 postgres    false    234            �           2606    16722    order_items order_items_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_pkey;
       public                 postgres    false    230            �           2606    16710    orders orders_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    228            �           2606    16741    payments payments_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
       public                 postgres    false    232            �           2606    16682    products products_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
       public                 postgres    false    224            �           2606    16818 .   report_configuration report_configuration_pkey 
   CONSTRAINT     s   ALTER TABLE ONLY public.report_configuration
    ADD CONSTRAINT report_configuration_pkey PRIMARY KEY (report_id);
 X   ALTER TABLE ONLY public.report_configuration DROP CONSTRAINT report_configuration_pkey;
       public                 postgres    false    244            �           2606    16662    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    220            �           2606    16664    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 postgres    false    220            �           2606    16697     customers customers_user_id_fkey    FK CONSTRAINT        ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
 J   ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_user_id_fkey;
       public               postgres    false    226    220    4737            �           2606    16755 #   inventory inventory_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 M   ALTER TABLE ONLY public.inventory DROP CONSTRAINT inventory_product_id_fkey;
       public               postgres    false    224    4745    234            �           2606    16723 %   order_items order_items_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
 O   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_order_id_fkey;
       public               postgres    false    228    230    4749            �           2606    16728 '   order_items order_items_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 Q   ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_product_id_fkey;
       public               postgres    false    224    230    4745            �           2606    16711    orders orders_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
 H   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_customer_id_fkey;
       public               postgres    false    4747    226    228            �           2606    16742    payments payments_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
 I   ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_order_id_fkey;
       public               postgres    false    4749    228    232            �           2606    16683 "   products products_category_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);
 L   ALTER TABLE ONLY public.products DROP CONSTRAINT products_category_id_fkey;
       public               postgres    false    222    4743    224            9   �   x��M
�0@���)r���e����M��L�L��������`
�T8yWpC�V(`#���do������o}�[f�b�O�9RR<�H��jlz��l����k��lc�.p���V!�0T��꿄�"� %l/�      =      x�}�˪(�q��q�S�lQ�u�O<5!z`p[Fj�����'�ΕЛ�H���ٷ�֊-���?������?�.������?��Ͽ������������?�����?�������O?�����������$��ǿ��/��v��?qĞ[�C��C��C�{h�������^[�C��C��C�{h�����Ck�y(~<?����C�_=�������C�=���h���~m�<������C����u��v�C��<��z/?Q��l�<������C���������C�}<���.?Q����?�C��?$��-�X~���#����-���k�+��-����B�6�XW�Gm�����Z���:��=���\Hq�&��{�[hv!݅�my�N/�=�-����B��6�X��aH�!F�a�C�{�gm1$Ɛ��1�=Ƴǻ�&�dH��V�,����R�L�2��l��u�y�[j�)]�t�m���2�u�_��+�~�ӯ}���_�Y[j�)]�t�m���2kOl�]�t��e�]��Ğ��eJ�)]f�e���s�kK�2�˔.��2�]�罥v��eJ��v��.����R�L�2��l��u����n�]�t��e�]��|�:��.K�,��.k�e{�V�eI�%]V�e����+��.K�,��.k�e��R~_jߘ�w���i�����i텭�˒.K����ZwY���J�,鲤�j��u�u�um�]�tY�e�]ֺ˺����.K�,��.k�e�{=[i�%]�tYm���ޭ�˒.K����ZwY�c�v	��%�.��ǎؠ]B��t��K��D���%�KH�h�ĺK�ڠ]B��t��K��j䏍�s���?9�?:?;bǹA��t	�m�Xw�sǵA��t	�m�Xw�kǽA��t	�m�Xw�{ǳA��t	�m�Xw�gǻA��t	�m�Xw�w?���.O��.϶�s��y�gl�vyJ��ty�]��.����N��.O��l�<�]�������)]����vy��<k?����)]����vy��<��'��>[������3�j���k;��S�<�˳��\wy^�yo�vyJ��ty�]��.�{?���.O��.϶�s����绝��)]����vy��<��:�K����K���.�u�ױ_�]��%]^���vy���b�r���K���˫��Zwy�~�vi��tyI�W������vi��tyI�W�����~�ۥ]^��%]^m�׺��ܯk�췮�kW��k����7��~�ۥ]^��%]^m�׺��ޯg���K���˫��Zwy=��n�vyI��ty�]^�.�w����.o��.��{��}�wl�vyK��ty�]��.����n��.o��n���]޹ߵ���-]����vy���k�����-]����vy������vk��tyK�w����>���n��.o��n���]��~��mѿ��E�������n��.o��n���]��~�ۭ]���-]�m�����ݟc{��G�|�˧��Yw��ۣ]>��#]>m�Ϻ�'�'�G�|��G�|�.�u�O�Om�v�H��t��]>�.��l�v�H��t��]>�.�Ϲ=��#]>���v���|����G�|��G�|�.�u�ϵ?��h��t�H�O������������R�j���r���?��h��t�H�O����y���^��._��m�|�]�����j��t�J�o��������._��.߶�w���[۫]���+]�m��˷�۫]���+]�m����{n�v�J��t��]��.�s���._��.߶�w��{�ｽ��+]����v���|��}�W�|��W�|�.�u�ﳿ��)PS���W+�\�\-0[���.8�"��CW�08��18dpW��}�
��J����`��ھ]���Ppp�����Q\�����uG�A��s�>t��C�����c ����}�
E�*��g����+����j�G���#7W<���+�$j�%�J8�x��CW�L8�&�M8�𩡏�28drhA�&;�7<��!�C�-�D�X���\#2G��D�$�(�g��&2N��D(�D�G��*2U�`E�+�`�'���-2\��E/�|��\12c�@F�2�����42j��F6���Ǎ�82q� G�9��ѧ���;2x��G=
֝���Q(?
�G��g\��!�*�P��C�"q�t#hHД��	NN�u'�6�j�BQR�*)��W�n�I�4)�&E��b�I�q�6�*�B�R�F)��W�nsJ�P)T*EO�b�J�q�6��B�R�b)��W�nSK�l)�-E�b�K�q�6���B�R�~)���ź�0�"�P�=c��1q���(S�e
�L�k�8g\��M4���P�=j�A5q��vl�(��O�u�6�
�B�S��)��W�ncN��):E/�b�N�q�6�ʝB�S��)��W�nCO��)�=E�b�O�q�6���B�S��)��W�n#P�*AE��b`P���m*�B�Z��1T�3�`��BET(���Dŀ�8�
�m.*F�ʨ�iT6�3�`�ƣB}T(��^H�@�8����7�o��'�Ϻ��K�j�P.���Lq����T(�
USѳ��g\���N�کP<����Oq���U(�
5T�#�g\��R�J�PJ���Sq��ɺ�S���PQ=���Tq���XU��
�U�˪hg\��MW��P_=��AXq��ېU��
eV�;��g\���Z�b�Pm=���[q��=�J���c/�,��^�a�'�6yJ�B�U��*}�W�nX�+�`Eo�b@X�q�6�
�B%V�+��W�n�X�+dE/�b Y��q�nSY�,+�eE�b�Y�q�6���ByV�>+��W�n3Z�H+TiEϴbpZ�q�6�j�B�V�Z+��W�n[�d+�lE��bP[�q�6�*�B�V�v+��W|���{{�➽��xuozw�u_��W��
�\�K�(g\��Ms�r�P�=�Atq���PW��
e]ѻ�`g{ܬ�lW(�
�]��|g\���x��P���yq��ۤW(�
�^�c��g\��|���P����}q����W(�
�_�ӯ�g\������P � ���q���X(u`�C�$g\��/��۹�z�����]�}�n3a�(,T�E��bpa�q�6j�BqX�:,���6!J�B�X�H,%�W�n�b�R,��Eo�b�b�q�6/
�B�X�d,3�W�ncc�n,�E/�b�c�q�6=��B�X�,A�W�nCd��,��E��b�d�q�6K��B5Y��,O�W�n#e��,�E��b`e�q�����o���;�����Y�ú��
�Pb�1��q��˺͙�B�Pi=5���q��۸Y�7gы��g\��M����Pw=<�A�q����Y�>�g��� g\��͠�"�P�=C���q���(Z�E�h�k�8g\��M����P�=J�A�q���`Z�L�i�۴pg\��ͧ��P�=Q���q��)~̆��am,Nژ���������6�;ocq��t�����Y�T��jղ�j9X��N�:rK�j�V-ժeo�r�j�qEmiV-ժ�Z��ZV�3���f�R�Z�U�ު�`�8�sK�j�V-ժeo�r�j�qŵ�Y�T��jղ�j9X5θ��ҬZ�UK�j�[��g\�liV-ժ�Z��ZV�3�x�4��j�R�Z�V-��ٞ��ͪ�Z�T���U���q�߉:~����c��,Nՙ��a���ͪ�Z�T���U���q��۬Z�UK�j�[��g\��ͪ�Z�T���U���q��۬Z�UK�j�[��g\��ͪ�Z�T���U���q��۬Z�UK�j�[��g\��ͪ�Z�T���U���q��۬Z�UK�j�[��Z~�d}e�IYvT����8,k:-�;.�;/�̲��ȬřYӡY;5�;6��Ͳ������Y��Y��;=ˏϲ�� ��	Z�Z�Z�!Z~���e�h-ҚN��������ô�4-;Nkq��t��w��w����e�j٩Z�c��s��������h-;[��Z��5�������'l�    [v��␭锭�-?h�Nڲ��gmM�m%�.�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3��������t<;oq>�t@�.�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8��۬Z�UK�j�[��g\��ͪ�Z�T���U���q��۬Z�UK�j�[��g\��ͪ�Z�T���U���q���~��ig`.��N�d�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8��d�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8��[?��ι��n'�NGݲ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5���X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+����,k;��N�^g=�gͺ/�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV��=o�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3��Ϋ����z;�~qf�th=�Y�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�lχu�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ�u�UK�j�V-{���U�+X�Y�T��jղ�j9X5θ⻔�o��k)�^�������a�f�R�Z�U�ު�`�8��e�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8�
�mV-ժ�Z��ZV�3�`�f�R�Z�U�ު�`�8����z��g��L��|��|��4v��A���f������ʬZ�U+�j�[��g\�[�U+�j�V�z�V�U��ģ�2�Vj�J�Z�V���W`+�j�V�ԪUo�j�j�qŹ�Y�R�Vjժ�j5X5θ��ʬZ�U+�j�[��g\qoeV�Ԫ�Z��ZV�3�x�2�Vj�J�Z�V���W�[�U+�j�V�z�V�U�l�`�f�J�Z�U�ު�`�8��)�f���7MMWM��`�f�J�Z�U�ު�`�8�
�mV�Ԫ�Z��ZV�3�`�f�J�Z�U�ު�`�8�
�mV�Ԫ�Z��ZV�3�`�f�J�Z�U�ު�`�8�
�mV�Ԫ�Z��ZV�3�`�f�J�Z�U�ު�`�8�
�mV�Ԫ�Z��ZV����u�U+�j�V�z�V�U�+X�Y�R�Vjժ�j5X5θ�J����6��ur�}r�;Y�Y�R�Vjժ�j5X5θ�u�U+�j�V�z�V�U�+X�Y�R�Vjժ�j5X5θ�u�U+�j�V�z�V�U�+X�Y�R�Vjժ�j5X5θ�u�U+�j�V�z�V�U�+X�Y�R�Vjժ�j5X��n������!�rH�rq=�t?�wA�wC�_iwD�%��["�k"�{"��"��H�*��\\9����"��"��H�1Ү�\�9]ɺ�k#��H�8�n�\\9��]����G���v�����
����I�EҮ��{$IN7I~WI~wI�e�v��]'��Or�P�Q�R�K%�V�ŵ�ӽ��Œ�͒~���-i�K.n����,��mV�Ԫ�Z��ZV�3�`�f�J�Z�U�ު�`�8�
�mV�Ԫ�Z��ZV�3�`�f�J�Z�U�ު�`�8��RX�֮��{a�N7òn�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j��u�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�w�_�lw?��ϋ۟��Y�ɺͪ�Z�R�V�U���q��۬Z�U+�j�[��g\��ͪ�Z�R�V�U���q��۬Z�U+�j�[��g{]�۬Z�U+�j�[��g\��ͪ�Z�R�V�U���q��۬Z�U+�j�[��g\��ͪ�Z�R�V�U���q��۬Z�U+�j�[��g\��ͪ�Z�R�V�U���q����~��]�n7�/�x��xg��6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V����^7�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j����n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V����^/�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j�q�6�Vj�J�Z�V���W�n�j�V�ԪUo�j�j��8�fՠVj��[5V�3��fՠVj��[5V�3��fՠVj��[5V�3��fՠVj��[5V�3���jP��j���W�̪A�Ԫ��j�g\qm0��jP��ުa�j�qŽ��ԪA�z����q���jP��j���W�̪A�Ԫ��j�g;�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5�v$�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j��(�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8��mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�
�mVjՠV�U�`�8�q�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���W�n�jP��j���َ �  �u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5θ�u�U�Z5�UCo�0X5�vܬ۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��۬ԪA�z����q��a�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V�3�`�fՠVj��[5V��/�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j�q�6��jP��ުa�j���ql�Y�S�کV���9X5���������]p/      E     x���ɱ1CϘ(��]���8�8��`ջ5J���	[���_�����gy�=�a�p8B	���*E"��JqqRQ��*�Ɩ����*{��e컏��v<Jj)Ik�9/0�Mi.z���W����E���e���l�j�����n}�w�y�d�T��L�a�\�lc�kh������
Hi6��E䵜.�/�J z���ao���m�����hs����Y�";��&[/C&қ�V���1��<dph�������`*�2����@t���~�,c�=��^��x�P�z9�+����ENO_����w?�kJ�A�y���k�y������I��p�8C���)=@�	y�p�4�lـ�@t"���l� ���a�P<����r���U�2l� �2j�h��g�2=���Z�@��r� �vꠦ�.��8-כ���ARf��~����ܻi6i=M� !��Dam}A��w���WҺ��z�%k�z���|>� ¼�      A      x�]�[��(���	������%r�uw����� �N���+���_�W�o����_�W�_�����W�5������Z���������~�߰v���o���/�[����7�-�g����*��/=l�_����3���׿������k)������V��Ry̪��|�߬?�nl���o�!fu6����R�am��JO�����o���ߋ����'�����ٞlo8�Iۿ�̿�~���8�^��0�6{����Y\���v�Y~����
e����{Q�l������7�,�{�ً�篯�bK�j��]6{Ӗ�F�a&�l{���~�|;&Yv��f6;+O��Y��S��W�:f6mVH�/�w6���W�?̡������fo��_�{��ز���e{��&�3��c����f��{�Vf�]v�fa�
M�fe�7�=��ب=����ٞ�����fױ=��0'�XIٮc�b�Ǳ*V���b6+�ZydL�-W�����cE������T?��f�fاH?��F�����y��ݮl�`K����ƅ9��k�%�0�����g���o3x@��fh:[����Q�|b��f��X3Y?��f���;`66Jg�%0;��,3�}�>ue3'�}�R(A��fOl�������s6)fb�2׿T����޹2&���f>�fe+*w�Ƙ�ͮ�;����1�����lv����9ٸg��\lV>������f�b��0i�<��Tx��F���c�P
l��]��0+�5ę���a66zX57����Z�2~����k��j{̜lY���s��1�N��\�=��+���ج:��D03�=�u|e�0iV�z�4X����g0���U�1;�r��g�`�`�Ʋ*�s��U��1}Q������sU����VA컣0�p.w�z��QVzb��� 3=��Yn�Ӻ��9��3=�}��3=H g�ʵ�M�A����Qf<H�=ٚ�|f�ZMh�̟쭇ԁn��~�����vM��.j�lWE
v�c�v]��SLWF+��79����X��"{.�E���g�ˣ������] ���s�H.�|���츌��"I;��3o%�������\(�?֮R1#�TR�"��\,�� �&�f$�K{���;�`&U��?a�K�}F����E�zk�|4�e�ʱhm�Ʌ��ž��wCE]:�$����\<�z�o�fr��s�N���k�~&�[TE������>{�Ps�5ε��*Z��fV�f$�Q��v=���V�n~�bF�b�f���N[N�zu��zʗ��[T��j��"����T4b�%+eWU*+R�����Gr��\X�D�J cK�X���-0\\��v+Q�W{��Ek]`m�5n�k��%v�v��_�����n���2��t?�^Å��Y�/�|��K-=$�fr���f��rk��?�NGp��*�䒫�Թ诫����P�-��㛙���V�o>F��}�wXS��vZ�����\�i�/>��^cp����fl	�ވ�;m�i11�N.�v��w��3#��uO� 촥8��-��f$c��3m5n���@��㖚z�A��*r7W��xf�&s����k�*��.�.��2��"��N���(�<+���l��%:y�-�tT쳷��<��@20\���:eFr��	Uu��`D"MS�j[��Et,�XJm�o�9M�i��y2�]����U��X;�^ӟu�g��K�]�z?�ᢍ+�j�߮ڔD����\���C�
w妴�_��J�M���V�Xˎ,�W�� �f~�;{Փ)�&�i�f~ŻXwa}<f~ś�u���ě&P�0�ě:�Pp�Y�me��É�B�c��čЌ-���Ȍ�v���un�ٵ�(R���"������{K7���v�!���s����j�	&���M7;U��lW��Ol;�ﳷ��m�/en�^�h��'۵��M����n�|2l {k7�?��G�������;Н�iu�׉�=�Y���݉�}��摻*	�xM�#�ݼ�}ZBpb�7�ֹY���O���]��^�n+��掝]�ќ�0%?�mb�-v��Mg���������R��M�-E��G�Y�=vܭ��bg�1�#J�⍌&�)������V�1��F���!���V�n=��vv�������1q�>;o�f�&�|f�|u[�{�{��؎�����|Ϫ(;o�.V��Ff�-�^PM��.ߔ��\�ѓ#��M}�p��CO�g3��7��"H��[���Lm�����ؔ���q%�=3b��{�i�u_��3��w�H���F��5ȅ�#�Ce���#���8�J1/vv��+���[�+>���8~��/��[�3��S3�xQYY������<u_�j��΄�5�jp��G�Yf�-�DӔ����*4В�ӧa���n���.��hR>��n�t�����Q�pBb�=q�x�p��D�[��Sݰ�+����
c+x3M����A��������(P�is��ӆ�?3��k���ٰ�V�15@��]�y��ϋ�����=���%�> �c�w#vT+�p�D^[��z�%7;��[QY�EQ���X�cNvy%��kt��(�p��Do�Y$ጲfJ
��n�/�p;��Vy|Ri��<>�܊�C0���z&��>�Vpk=�kMK�X��e+8B�C$�Iw������.[­7F�����nwe|�5ܞ�j������������ ���ݮ�ex��Q\ó<���]�] ϲ���uѸ-���uc�+Ⓢ�� ��=v�#��G���:�4̲�o��+�|Kx7���?vq	�A}X�����n���l	/�����w��){���\�d��'�{�~Ǯ�K��=z=ǤM�v	/j�<3Ɩp�����c��d�1ul�pj�:������([�Ci��.�h�5<�3c�߳�3�..��梁b�-�ռ�ι� �pFլ��.; �Kflތ����fF�C�����{��3H�H�l	ǥ�n��nE�V��������>��7�CC���%IӀ"v9���
0��7��z��-�H�d���K�ݗ0�s�p	g�/�lO���GE
��N�1��*8��)vq�X�FN<�
N|^T�[��u��}T�W��fb�x���p⾓��w�Qh��^���LX�]\�w�s �{$O��<� �ױ�����}�I�J߃��O�}���p.�;on����Kx���qq���n�{d�g�s��>��aC���x'��M���kP���#iY��[5x4�]��[̰vq	�\�3E��Hy��K8�z��+)p�.��x~O�� |6)8v�Ax�޿.�%��3�f�v�Ax��0���(��>�.�T݂��]����H !�K8cz���n;
/�u������<��Jx�_�?����1sq��U_�J�O����t�`�wݾ�&�̬o��
��^��+1�+��dn���{>y)4¬��YD�Ȱ�+xV�3O��Ie\&f���*�M���]]������x3���ճ�Q� z35l��]�~��>��'�<YS�<������x��kF��]�C���O�7^�`j �� ���<S���N�g���`�hF���O��Q� ���L5`׭��N�]�=� :��\o�j�YS��ca����_ی��p�<b�z��	�|0.l�bF�#�|I��u�@[?N��]��/�x�u�(���]w�Ja�����u�]����G){xj^����/\1Υ����5d�>�WH�3+M\�~�w^ݍ�}��ρ��hY�bo��<Y��]]���)L���W�`vuϊ���iS	��\�טZc�2D�`�-�����b�=�N�S�g�qbp��iZf�=_�\���C_�껙Q]��ն���i���',~�ЁL��V�ItceeF�
�n�	���#d��D_Ic���	�GMЌ���7�,^�Ƕ:I��Q� :�n]7v�18��lF�
Μ������Aբ&cF�3�8��c�=��f%<��gV��yǮ{�y�ľ����8���fԭ����QOn���M����Xc�=��T�Ů�u8�����D���0��Y��Db����    Ʈ;W�-h-�~\���H����5�noK@v��$5m�1���+�f."�w⛑6s�����}�¹�N��-T����c��ͳ�3���� P^��o��8ޚ�׎��c����$�}�F�ǁ/���=N|!�	Ǡ=�|���5��8�eg�W�ؗ�����-��=���3h�f�p��� %�\f�_N�����=h��RP� ��M��v0�yШ�4��	Xg^�n̇X&'n
�]D�``kT��v80�0�Z�"��`I��5�P0$1q�˂�*��,3�˵6fu�=����`��I�vx0`�B���<Z��C��i^�$�I�F�������Fqޅ�Asۡ¸E�g�X�7��pa����`M� F`�5��a>l�c8l�QXզ�`���Z�ò]޼��08%���P�L��!V�Wރ�1���5#F��-ځ�|�Ϝ�(1�V�l�Ě�Ʌ�.'�݉k��>P,kh��bÎT,�veNܬX�.l;�XR�e.N;�j��vx1�N���ć��v�1���\;�X�L�s�1����k�K�|+���1*�Tt�1���;i�2o�K�=*a@�]�eǨK�]��l�=�ӂ>F�=U8�s�&/ dE��@F9�5A��㤴C�9���B�x����G��R"����"E���v(2�A��>]�F�����;I�G�Ӡ�ć$��,ՇÒe������d>P�S��J�O��F�����|S;D�}ˡ(�����ɠ��)c6I���@et����ʪӪ=Pe���6y��<���@�A.�e�6U�1��E?TY6���TYw.��,�˲��U�̝x�֦��)�/�H��{�K�y���_���$�J�/UV�cZ[�*C)��U��w��2bq{����$�W�ʬ��R��������������Q��~�_��p8�����T�X^r�{�ʬ����QK4��#V6�X�~�2����Vfe�������~�2F��L�be��
T���ѳf�z�X�ƙ0�_��w���#W���]���̱�+#Ty�YWF������a�~�2�S�o�+	1��+�#J4�~�2�l�\YRLu�\Y�'��\YѰq�����]U�e~_��~��"����~���H����2ܜa׋`ٲN���`��#]i�`�3E��X�D5�`Y���s\��S���!��?��#�e�-&H��eYc��,�̪�)q�dٜ^�#Z����~�2��G�q�2w���-�g����E����o�h��{�2 <q���eI��N��e�g���.Z�c��x���%�3���eN?[��/[�R�#[�Mv�2|�G��e�쁚��~ٲ"����l�M�v�l����e�4����e���mdˆ�D�Eˬ�����e�ҩV�2�Bj�-���sѲ�yYj�E�|x2A��_d���l���u��زj-��3�e,�1��_�,il	��pY�T,��2f#��"\��.KZ�2[V��Ö1:-�wD����خ͖14)op������e�p"��-+
Ru�͖!h�hˋXMѲޅ`���y��L�w�2��EB�[f_՜�q�2�@��pYq|aD�lz�4.\��\/�e�Gǅ�uh��q�2j�h�q�2�O}��tYF����.�KR;�.�,6�t�y�7.]&�A�;p����.˚I^�;pY�fոpYѺ(*���^��%.�Ǌ%�e�{D�D��^��n_�ƅ�0�^-�e�5��q�2Z�ת���ۈl���)�-k0Y�5.[��x���e����]�����`.[���G��e�,����?i\�GMu�eI���e�+g�i\�b�oD��H|r��hGb1��<ld�Oˆ��G˺ƑǇ+��+˚ɢ�\��0�>>\�]/re��&����h�/dD���Ѻ�q�2_C@�\�?��#�X}`�+s����`e�=Zru�2����_�6A��T3� #Re�
�w�2'y�ޑ*+cp�K�1芫7.T��북*�Ca��Pe��*sd[��́wz��e)�}*�É�Be~=�ƅʨ���*K*P>ƅ�4;��۸PY�ZEV�E��L�����R�;PYQ��q*��ǼP�0Z;.TF�,2a\�,i)��2�q*K�ʊ�#�ϥ�^ϛq�*S7�q�*˚��Rev�J��2�μ�y�2�;3x4UF�}|�ݥ�
1��]+s�7q������q�̩�ή��-�;XY�PN�=�*��̩��*�~s���xh��g�ʬ{�4��hb�{�ʘ����Beŗ�r܁ʊڎ�Bd�Z�~�Ôe�&��eʘ��8�LަQ�Ô-E�32eu����)K�T�/S��ZÛ*�ź��2�@��,1�d��BeP$�ۜ*����Q�F��)�*̛]�̧|y�˔Qz�d�2e�HY�G�,uqM32e�j徇)+Zr�*�Ȕ-��x�Ôɓ��˔�v�q�Ȕ���	i̞�˔1�8��y�2T��˔9��sS��j����re��z3љ�˔e]Ϻ�y�2ڞּF�����׍H̖E:�"e���y�2fT���"e�䍽nD�Xy�8� e�\��gD�JQ 6/RV���?#S��X�L�do^���Pq9�"eE��ฃ�%�=�Eʊj_-"eC�8/Q�#�u�����a(��ս�1��qg�����e�����(Stʋ]�,i��m#OV��`^�,ki784Yr��3MFWN�zi2�)�K��(�y3�d�;��H�)�_��B�2/M�,�?_��z�8�3�d��yi�"�$sn���+������aF��Z�="Nf�����d��p^���U}ͥɼ��{��d��!�&c ��yi2�E�+f��X�OOh��E��7�C�e_4�lצɲƚ,�X�&c�K����d���p���ڢ��'# 2Q^'s�´f�L윸q2-���tE���$�t��Ɋc�����!�����8|B���<Y�xf���@�#��W�`�XW�2n$�x]�,)y���-��@Ye�
 e��'���L�����d�,��.O�_��dYqm��^��شP���s�=OVē=�{x�����sO64a�.N�E@�(����C�L�&+��2���=�e(�d�w2��.M��	l\�&#�r�uq2J@# ��d $Z��.NK�hr]��ŗ�wp����	'�L�Ϲ8��&��N����uq��Y8s�����^��ɲf���'������y�*��Ɉ�^�����%h_'KZ�e���8Yր�`���싛_B��8�EVT�&cA���H��m�׍4Y����d�).����dNkY��"M6Y�iU��dI&Ezi2�]�ra2<3+��%���SL��e�.L���Ja2ָ�5.L�fz�a2S"����b����d���|��a��օɲRb�i&��3!]&�°:�w`����"+�d,��v��9�8��.L�bHΐH����#�&�*\'+�yt��ɒ���*/N�8��܀�5��M�W��XoK��8Y������d��m�������-�dɋ��dC<�ui�"̂��4��(̇&�Z��.M�����dt�B!V����5$A�4Y��ϋ�����9��y2��rٞM��D%fq��s�<:˙2oH����Ѯ�=���{6X�JZ�d9d��5��!�h�l�E�`�y���G
y�}�-cE�R�D�,k���m���X�B&�e����e�4t壹I�X�>u�M36|�*=�0#0��a��L��]b�(��y�����V�]Ȍ��*�C�%E�z����� [����׀��Ͳ@h �X�D6�'�f}���}�5Ӡ(��f�XeP|�6c)�B���1Q��p������<dy��9�)Re
��� ��s�3ڮǦ�PgE���xHI��߷���tP�I�%�N ���m�,)�A�\z�d�w�fϲr�j���%��6}FZ��~ƴ��tH!I�d��π�<�� 4�O.���W���Lđnq��1%���f�u�#����y"��ު{@4�@C�V�o��8��h>����e���hH��a    ۷i�� V��.�6��_Hb��!�q�G�K!�����
>�n{�4`P����G�7�o3i�*�3b>�ҽC;PZҲBU�@����\۷���,4S��\��TI�����{�4��Xbv��a�Әt�}�Ns�N�M��Z�zq�4L+1�s�4��M2�9��$)�2�\J1�h(}:������������Z���|؁1O �XҡzqH5�s���<U�m�F3���g �lz�V�ѳ}Wk�sJ=�WK��I!�4h����o4�'��u���q�G�nd�A?����5�t����T����CkN#�dh��Z�b64�Ve���>#I�R$���C��ѵٗ�+�욯�<O��p�N?�^o��i_S�����kh4%c; [�z
̐�����N��1E�-���>�)�`ȍǱ���-g-[H��h���|ңe_P�B~��eu~��  �9��fK�s����Qҹ �1�W;C�4&���"�6����/ϖ4GΨ��
x��y�6{��s1U����iz�#C�4li���ֆ?|L����8�mYk���년i�!ST�hu�|O��i�~SK��mC�#)dMc�ћUL��Y�K��QݩK��i`��Ǽ�Ņ�)}R���a��i�Ћ�M��i)ys!7���
#���s��i,+V��˹M�L��[�����t3/��!�ZQ�U�ȺA��^�$@A
���2�W��I�` �ȐJrY�o!]�x�˫�Eފ��#󆓬��U���O͗"�K��[V�Ge���hZ�5�{��ѫG�M�ה�1�oK�kRH�����X��[�a)E�-{ʞ2�-��y�,�M�s�5��t���$G_�"p�*+��'�d�)88T)�����u@��c�,y�s��sigL�&Ǟ�Q8$O�ɳ6����CW����w1��H%���k��?<\���mm$���n�Y�F�7m	Co�5:~��y���R2f\��M:ncq���ps�Q_�{�ƽi+��yȸ�����v�'����8-�e�㲲 ��zM�Y\��qI������	M��k��8}���9sd�n�����Jm��{�؇lJ%I���`����$lN*Yj��F��GGP�xd�G�<l���1|�2C&6�yWĔ?�ܪ^".B��I�&��#/0ǀ�V˥�����5�|l����z��$D�wh�U�4�OJ6�	�BN��<�����UO}�BV��������%O5{�9�F�>��X��R��\�e�:=�fc�I�s���Z����N�٘Y:2�g��Xz���m1E)$h�	G܄9���21�m��!���[�c�$m4�G��'K�*�2���
z���%9�j1Q[ko����f�?|@������<�c!Y���ծ/T��LXU)bu�<�����R�׆3��9�u���ئ����:!ۺf�٦qJ��u��R�y��,'C�nL�֚��yۨ�o�������1O��c��]v�#E��JI���v�׮x蓾�ȉA���-i�G0$p�r�U�_�n��/m�I����pR���]�^J>fq#j�\�������<n�E̐Ǎ��5���E�z�ݥ�9�?���K�`��ƀ�����KJ\%u��w�oG��ф>!�]Us%��'����.k}'�s����7����S��Ս��<�M떔���M�1���jof7\�G��M�Vt.����U�HhL���o!�CH���n�ʿӻ��q�E�d�D��b�o��.�/�oT�2B�7��E�����eU�O�7&�uv���{_"�EJ�z>�y�Uմ�O���8������D*�6���#k%�x�����!/���{����c�:��yo��}.����qἚ<�s�t���p��y�0��5Cη��%��oC%]�z�TW�<�}�SK��'����齋����cYE|1=�x����~{{�O�7fI�vPσyՎK�C����7�6��o>[ˀI��^�����]-�>)���U�/��,NhH��{ŏȞ�� i�����8恣3ʕ�=���F?���P���G���n�ߗ>��H�(�'�,��/���u��{ÛL�t�ΐN@�n��6�*Ĝp�?��!)�A�K��LF�J���Ԋ.�竂�/�W���ȐxF��|���/˗�B�Va>2Y�ߍ����C!;�����y�>g��q��pd�\��8��#��yx�1?P�4��#��iS�oy?w�>�L�kF��H�?�D���	U�H��x�'����1.�g�kT���ކ�ŵ�1[\�˿���G�.ᗔ���F���[=�a�|��]ȏ�%W)�ӈ+�&�Ʊ�X��p8?���rݼq��ʥ�n�, ����\���wY?����ytܥ�2n?mqy���|�o[\�/�g�t�K���B3�r���mD�H)������"�7�q�O9�R�N?؟��4��H.{jT~\���}R�U%WL!�\v���#�י�ґ!�vCG�/��y����S�(^(�c�S��� i�!��������,�i�!@Z�'�+vT�1�\2�-�A��hI�w�9���x����a���>�[#X}j��[Nt:W�4 ˬ�u��\Wt����c��_Nܱ�	�X�:��0��;�s,e���a*ͺd�1�yy�LH2�����̭�~{�\�xU�g��U�B����Cj�LJ��t��z�U��k���r�%�y��f��O�9~p� ;��{��r�K��"P�� ��z̘q��F�%?�`��}c�9R�u�'`������$��!�u.˙Piƴs�<^"*�g�5/+�4�ud��|�'d�{��B�t8҂��K^\��aِ|�MA��`���(���/��sa������$d�{Ә���4���7蓄.��G�� ������-#L���y�A
I{��n�7���?q�B*:�n�HHE��w>(���./o��\t��|r�5g�>��Rqh�F|��9�@�w�Z���%u����GWO�c����$���      ?      x���M�&�EǟV�� ��$z-�v#1Fd����mg�p���u�P��S��>k�����[?e�����������_~���=��>�ǿ����_�����~��O��O|�����~��/���3s�'�����_���������Vn��3��H��۞�q>W�m7{��)��]O�Q��}{Գ� k��p�g� m_��{��ؾ�菻�8|�`�������k?��c_���^<��p���������q���W��q�gųc���"�����s�ߏ}�?o[��Vn��q3������ɶCV�Ռ�X�b��y��R��9��+>���Ur֗?>Y-k�^�E�Z�ۊ|�a%swξ�������sc�u-us�'� �R�z�g�ؕԵ�gw�P���,��q-u�Жk�v)u�9������?�������}��k��r=#U}BJ���/�CI����`CI]��q��I����~��Sw?�O(��q?��x���Y}��Z�������'��M<�p(�{�kl*�[�n����FWes�N)usc��p*�{w<���ҕ�_�Iਣ��{��)�n�x.���S���l*���`Su}1Ao)ukV�����8�v+�{o�i��Z�H�;@o�Jff�VR��=��BYJ]ԧ��k�@����R��C�?m%u�q�`�4���s�=⨛�~��Rw_o~�SQFݕl�`�����^��Rw���{�>R�:��T|��9vO���(��ij�GKݳ1!\�IJ]t����D���~�D��*�[�>q�+��(��ڨ��X�WI�3�3��*�{��b.�j���������w�`|�Q9Z�RR���]k�--u#�5�R��b� �����G�[J��t`KK�B�������H����h�J�p�3�RR�`TAA������)wW�sj��)���.�6%9����Aئ���>6q������m*Y��=A������l(�	��2�P�_���AJt�4-�m*�����E�%w�ls�c-�����B@�4�*9�#m���:a	��ث�Rb��v��@�5��1]-4C�,�d᭶�ʒ\�z̰�h��/K/�&����}I�d���X�%}���aE�J�T����
�i^kS��"��M��5��Knk�Ю��h�ŉ��n��:���I�f�nko�&9�(�D�����? �U7�s�:_��QK)n�9���.���
�h�+?>9"�������m���%����׎�/l���ូ"�y��]�6�|Q�aD�$�u���x���U0%n��Z�:�M2`�q#�\r`W@=H�DV��c �cŃ�=i�L����E�%���/2��h�.{*\��>,Q*�"�f�(��n���2.k�&Z���b��4/���,&A�d�84M� ���B4��	��v�vW��M�c�z}h�Y޷�l�#��J	�DK���M�d�'3�I����ͯ�R��a���x��l�ə��M�e.G��$cV�x���I���6њ�t<pӼYfu�4s�o�6ɝ�z�r�M�g�"��i���z� �dЎ���I�)����-Q�'���k��}��A�d�*ߦ�$������6m�o��������
�IFm��)�$��i�{�[�j��b�}��@J�^�u�f�ҩM	���V��>�&�5�����B��xW�M2lH�n��Mrl>����M�l���i����v��I��&���"��k�f�kqa�h��-��R����_�����RMu�����(��o������{���F�wMa)��|�@XLq6�/.�x��zi%�1k�ꎆ%�f��1�Uݶ��m\�m'f?iI���|n�����E�vzC���m{��%ݶw/�jX�m����M���uh��t[�O�]��t�a�t�Fz��⠞�� ,�Xƹ\�n���bӒnK�����^�EX�m� �!qq9
V�_�%7�Ӗ6,����������>�n;��CҒn���xS�%�Ʈ�x��n�y:��5��ŀl�%�v�p�CÚnCe�ޓ��ȬZw7�鶃��An��t���#,aI�m�����#ޟp��6g�?Ғn�wMuÒn+��͵��E���{�t��D���t's��X�m�6Z!aQ���k������IK����pn۱:�	�����ջ�5�v�FX���t[����&��6����-�!\�m�^��1HK����*��%ݶ��_ân+���O�k�����DZ�m~ަNX�m���̆E�fxU�7\�m�7�"u��5{�W�J1�ltm�E�vY) ��k���8�nZ�m���.aI��Z!aQ�q�_qM�q!�E�HK�ͫ��%,�6~]������:�au[�ܦ%����L?n�U�u���۸����E�V�SLҒn��M�[n�˟D4��Ͳ�d�n�R'Ə���l��iX�m�ϻUd�K����p�k��oNZ�m��U�Xn;ՓX¢n+�n۽�iI�q�@?7`I���u������Uq����i��v��_H��ы�5����X���n;ȍ���k��fq�%�nK�>���n�
��:m�C�|򃟈+U��s�vI�afBA�%�� /	���E1Z:q�t�紉�K�-���vI�%�����6v#h��]�m(�8ҐvI�[!��!��n����x���[�6_"��6Ã{Ү��Dfx��-}�җ� �n[�xU�]�mq��+�\�m�]vI�q�X�oQ�em�.%�n3#�_	�%�����w��K��z�9�.�6��K�5�f���m�J���_]��ۖ�W&�n�\�7sj�����]�m�.k�.�C���x��-�p�N�5�֥:Ю�6��)�.�6NޝW@�E��B� �����\��� �.��udhT�]�m�'f`WW���O~8�*ܳ��,��ko�%���7-#ޢn;\��wU�9�Q�vI�qNʦص�mgs�E�Eݶw�( ���m�s�K��kԃ?@�5ݖ}� au�[�>$�n;�7n�vM���>L�%ݶxp�6�.���D����l���\�m�z.a�t�~�$aW���^kH�5ݶ����K�����n��KvQ�zvn�]�m1�#i�t�ݽ+��k;C��� �E�v����]�mv�~��P��Y�SvI�q+{"����֝={ ��.�딟�]�m�V���]�m<��"ހ]�m�����k��[�/�K��p�� ��ctv4 ���
�1�qh���7@���:c1O�n�\>�.�6L�{� �n$`�Q�vI�~z�%��%����vQ�q�%Q�n[\&�F�%݆�nO� ����m<I�g���8�H����mgn�A:$���0���Y+�87�A8T�死������J�tH��[}�!鶳'uuۊ>�xh��P*l���_HF���Ů4mz��1��#�ւ�xh��f��C�m�/���D�}��u�BOœ}�����H�B����@�!�6?]�Q��Q->9"���5#{�M���+�t�c�<ei�:֢��xh�����I���8$�v��� ��ۂ�yS���ۜj�~��Q��}��6���nT�C�L��h��C�mt���y������[�!�6��Ěp��c���6�^;A:�ͤ&��t[T��"�n;(R<�AJqt<|p��&o&E�B8$�V�rb¡�nC��2,�,5�D&�1���I����y���ےۍy�[�m��}��6�ї/!�V��*�pH��$W �n�Y�n�����1�M#�n�z;\�!�<Ⱦ��y�a/<xh��߂���C�m���n�W6a�C�m�����5.�A4@�v�����n�!O� ����,�!�W���o�f�{��n��-`]�K8D݆��<4�vNь�m3��s	���O�� ���ֻ̄xh����g�tH�-��/pH��0� �VW�UsH<��ز�)�tH��̸'�ph����B��ͤ|^�t��-�tH�m�;]�n��!¡�n��nn �   {�]!�n����������!�6
��Fuy2���ߋ �n���,�b�'�x�<p���*�D���ۼ[.�t�9����tO0>�n&E��5qM����XСm&EO�<��� :��ʄC�m��8m*����v��Ґ������o��H̦      C      x��������'O��a��%�Y
�$��i��M߾�Nf��
�M7���شH��g��^�l��'���"��)�7=��9��/����/�1��������/?���Oߵ�f�߿���~��������/�y��A��2�ǯ?�������ן^����`�����������<�=��5�^���e�k������k�</9�^/9�+��<�x�@E*��c]OP^��SXu���y� KW�e#$���%iX����c�'h/Ic�W-�}>���4�(<�.���4��\��y����%id񲗌C��/IC�bD�c>��-,����mr*.^�N;��;���s�~���v4��?��.��F/�_�a���4Ȟ��C�{��i�}��a�J�+ƈ�Opc����k4��?W=_��ǃ�4�B�\��X�{.��ɻP�$�fv����;iQ��h�ZN�s�c=#�VRcC����n$ǎ'�22`-�G��џ�/P�$�u�p��K7R�@�t����9r]�hϋ�*9R���e9�n#�!n��H;�3Z%G�I�����yu9���_~ j�g� �J��M�z>ɠl#E���X�g�qq��W2��:��cA��9�(����Rt�� �Kr-��@��)G�g� ���U6��9�R�!F�6��)�:�1�k��z�j�M�(�R�	�?����p��૜"��zUR�`��m�k#E������_�y�`C{/Ы�"G��}��9�<ڳ|�S$���# �J�4Y���62��Ʃ�(gH�� t�2$
��\6���!/��~^/���"��2
訤H�'��	j��H����<���)|���Z�D!CWk���1rt>��$)x0��#�5+I�o@��F�l�\��J}n� ���PGQjn�HOr�{v�S�\�$��f%E�*�]A͍����k�S�`��g��	�:+��F�4����l���"W� �U:D>|Z	��ƭU��� �jh��*	R���6�Hh�^�+��� ]�&+r���F����yy��~��6��YI�qB[�crn�I/|��pZ�r����9+g%UN<���t�@9��ﴜ�#�p�qT�Z��Ο<�nd̦g����~�ę!,Q�����{pwk#q^ø wZ�&�s��z�:{�?o������1�[�A_���uZ�^?G�u#Q������l|�uL�F(�pt�'��yǟ��;�������*|pL�v����+ K������\Y���i�X`����3�5�%o�ӅG����#�����^�t���X0v ��\���T.c��\�l����I��jY�0�%�p��7Z���.�'E0�U�x.�!j���zz�⃜�����㊧�d�k���ҙ�~��M9��
%X�E��a�\��F	LrE 4[�ů?��ZRV�3`%��1?Bȃ�\����h��J�s�Q�Y���)o���\@�H�W��� ��:-~�������rx��E���_����jS�c�G��r���;$Te�$�
ba3�h�E�ot!z^�J.�7��i�&�b���r�ă�\:���Tg%���?l����a�l�ʼӒ\R�P���\@x�놈�Ճ8��üh�e��+���o���S�K1�^�-�����nXɵ�w-��m��$B�t	���g���UQ\L^<�.Wޛί4?��zB�Z��@K.,�A$�I8+�����gx^�I�*��AP���\^ U���g%�>"R�+qLrm!���Zr��jJ��E���"�g�"�/9&���yY�����,V��˥������\g��n;h�z`�)��J�8��"� z\�I.7ıJ=N^</���}v�uVr��s�a����l��fZr��6_;�>&Yɯ�g��I.=��7|�v���|)
��ħ��9`�a�r���.�"�q�6 +��|oί�$�!�y,/@K.HP���`%$>��o�p�s#���$\>�[ί�0g����W�Ε�Tolg<W��x�t9��0!��l� ;`�u��w�~���?�J~աa���vT�Sy����_�\X�����À�M�D<����M�O�]�fsU��[�7�QH�����\���	����*�y�n,$��ڀ&�n:�%�y�f��ʃ�U���_a���rA"ʯad�s]�;�,���M>��X�H�	<.go8�%X�s6W%>Cx����rA"����΅	j���L<�\���
Ƨ�����޹Myӹ0�Ï3�C�\ԭ,>��7�+����=й0���
��Ҁ��&K�۱\��j����M��o��mΛ�e��N��E�c�"��eǠ��\��������,�^��<�tc�"��.�j��\�����7��������%�p�Vce�se�,x���u�O�kإ�%���`Q�se��J�����u��́����rI"�4V`o:W&x�g���u�wش���X.I���yŬӹ2A1?7^n6�%>�}xK��rI"�=Fx�Ε	Z|�q�l�K|�l�k/7�K���!!��G妍�7�n6�%>�N�Y:�Kq�o�s:�&x�O���0�/Գ��&�\�W^�{ӹ4�������0�NR�CA�X�I��_O��t.M�n��m|������,�<��\��z�Ҝӹ4�{�Qo6&޻�"V��\��c�ۅ7�K<7l�e��\��<���7�k�ʟ<�~ù2��o;���.�9�4�n,�$�i�kj�se�E��u������ңc�$J�{}N���g(��u�O�ߛ�W�rI"N���s:�&�y�n#�(gsa�`������ķE�ŷt.M�{C�ogse�32�� �X.JD-�Mf�sm�)\
\gse❣��7��QK���t�M��y,�fse��&,��X.Jā��B�M����+�8gse❣�]���=v$ؓS�ÚK��q������{�GEH��c�k!E�dI�iͥ	�l��S6�0W�*�N��� LsM"DM�x�5W&�]vW����e\J;��$��;� 9�u+��o7>S��Z2Cj-T�����Jg��n�45�{8�%O$�m�"�v\��P���G��}��)�.sVk�H�u���x#yۃ/<�n��3�/ QW�G�Q�vLw�.^Nk�"�'}����L�$������$5	B��Z7J��:�j�)i�*���x�1K�K�� ��vI����Y-&��uH�ˤ���-��3i�4i��ߝՒm���Ri��o�N������n��/�s�p裸y҅�#��t�>I�b���n�ԭ�*wP�Y(	*JF���s���Z�6J�D�Fg�d����ѫ�鎕�������7��X�tVK~J��t�c�c��[�sZ�J�s\�������"�Lw���/l;�uo%b���ܕ��=(l�鎿���������'g��dnMG��n�,Ix��i��,��;�⻗��;����%��SeX�fK���SX-�-��[�t�p	{C����n�4F��wVk�K�g@`�e����Z7^�rt��j�z	e?�����Ҳ�½�Z�_j�5�;7�b�t���#�v<��}���7^�	��T��Z�a�p��=J�tǉ������Z�bj��a��ܘ<�P��1��c-t��ֺ#���v�/f%�zn�0�qe����8h͕	*mfx��Y-93u7����;�L^_�	���|��w+�Z2h�Jo�tǢ���3�N�KV0��!�J>M��`�����5��X�	�U���u%�&���ލͦGC��nؤ.)��VK�M>��V��tǶI����Z7n�[}�%�jɺ�kJ>� ��&�p.M@kݾI%��8�%'ܣ��X��3�tZ��-�����l�3l�����EL�l��ɭ�e��=��SJό�V�p��d��&Q����t�o^���y8{\��+76��΋�>�_>���#s`�V�p�z}�ٖ����H������Soa$�Y+y8]�� �l�©�rI��-�pp	OX+Y8�a�்�۱p�Z�:w��NQs��   ���Z9|O�X�-'��f����S��+��V�p�6Z<0��p����A[�����W��+y8�?-�l����g*˜�����ϲЎ�j&Nv���1�1q�Ꜷ����?-Yǃ����b�l�és��i�{8M�s䬕<�����x8yQz��G��=�V��X+y8	J������p2�Í�>�������Y�y8yc�n���Î��Yp�p�vL����#5�1Y����ί��!�����5�+N�Z��i�� /��~�ƕw�	�1��u'�,�+@ؕL��uz��1�1qjX<�W�m�ĩ��P������g�X`�c�G�(����d(HFu�JN�M��p;N�="��wu'5�8g���L���l�é��ڵ�V�p���m�Z��IGsq�vL���/��nⴆ�"䬕L��e�Xw�vL���H��V7q����p�J&Nn!�7��8y�l�m��[Lu-� �J&N^��x��8�Z=5��n�|և���L��WP��1�1q8F�V��&N����J&Nn��U��_Rڙ FE�uh�0q�3�8������Ȅc�c����qe��&N�yt��Z��i��v�c�c��/7�}�Ӷa�t�qg�f��a��l���+Z>��������n5���j����1�qqj���V�q�WϹC�J6N�U��"n��I��r��m����`�d��q&p;.N�]qA��.Ns���\�����8�<w���z��qp�q��\���T�VbG<>�W�v|��w��.^�      ;   �  x���An7 е|
�@�%�]tY��4I�����%E��+�@]0�g4O��巟O�����',srW���_��߇�O�}���������_O?o�f���|���ݻ��}�~��s������u���������JëΑ�G�=:��N���\�'F���i���K�Ta%�_�����F�2
-�-�s<��{��6�(�������G���>���m�YVYc֫%F���8�ܣ���WiWY�E��%��j�^�|_����k�8&h�eh��ɧ�	�Heh��f�3�Z��;�h:���6��L�mf2`9Or3���6�˴�� z���6�T0�<Bf�h&�7G�Tq�^gF�DC;g0��!7�̽מʠk�9�Yn����TW�-	�`�ss�m��%=��c
3n�4c�#�����.f��I��y{�� ���F�4썘F]�5[��y #N�4��ʹD��0��a��^1UKD2�hpѠ��e�H�B�.T�|_���%XV�c����3�%��&�y��yȺ�Z�$���3l�SJ��zK�0��Q�6�*f<K4�1��F�
�&�+�j�y��@��F��U�T��D�Km}W\+h�l�k�L4�h�Mz֑�i��3i4��QIᐚ��C�.U4�z�2�$::�itҨ��H��!%�9��F'�J�ԑY�$:8���F'���V{)+�VM4�hR�(G���$:85��&M��^�9d�A��K+�hrѤ���Wf�	�r�L4�h�U���J�h1�c���|wbV� �F�S���hB�4�=�8wp��(��&M*.L>���@�4��{�*R	F����&M�}q����`�#M.��h�#w6�p:/d����J�s��[��`a�&���E˞��h�N��DwݷhJ�4�<��Dw�w�ݱr����!����ޣ�:虃�D�
�/���N�n��Q�T����Hw'ݕ���G���Ӎtw����W�ԧ��F�;鮤IN3�)ͨ�F�;�n�hI�jJx��v#�N�7iɐ2-�t^��L��f5�dM��$��W6��y��0��pH��4;iV���g�n��l��I�kٝ:HKt�&�]4��5�՘D��z~�nߵ�w{�ʩ"��d��f�*Z�Re7�e7�hvѬ�Q���v��D��f�u˹�S�
��l���
zʩ(��Jt�(z8��I�̒!���1�p�CA/��%�Dk�0��E�-Z
�T3@����0��E�-zB����}�s#=��Pғ���D��#=��P�[�� �x�X�˥�ݭ�����f�DG��p�c7��(Nu�%���H'=6i� w�*�Aci����6-;\���nN���nz��&�R�-�Aci����ޤW�i���3��馧����r0:�L3=��T��8w�*�Ai?��t�s�`�\�-���4��t�ӶiɐY�'G��4��M����27#�-~�����ަ/)�3�g�MO3=����7]��	��L/7��4dMK����^Nz)i�W�V�E�e���^��-��ȼ$�n痴��r�KI��)R[�
�e���^Jz^Rxg�%���e���^v)=+��!�]�2��M/5-/�eHK0��0��I�}��SK�'��#��׾�j�^���g�����G&�MK���^fr�;�}���[�5<��H�e�z�%��܏4��n��_�����O�      G   �  x��S�n�0=���|&vBB�U���mV��ӬU�Y�4E�_;H��VZ	ϛ��1��d���Wi#��z<a��Y<��+H�M!��xFy�[��:�Z?�����"y��72M�ӎW��6a#װ������]B%�?���3����8��%���I����|N��t��k�C4�74�{B��>�X�TpFA4�E[�Q�iO��M��g�1��܏u��{���U�E�lG�Ɍ��S7`��&��啝�^���a*���)Y�?�%-u��j�]�7�n#��NY�p]s)N�5xG�G�B����0���� (��4#,�f)���3��.����2����ӗ�W�]h��wȅ��:,!��r>����t2p�WW���^W�]�z�ޝ���-J��}�ls��C�64�/ԥ:��[�@��󪕾ؓ6����ӿ	m���l��[W�M�K��H9�B��:]~�	7{+��=��f9c9�ƒÎEGE���v�      7     x�U�ͮe��q��X{W��{$�����{!�_N�ଘ���������Ͽ���������������������������o�����������yCu����yC������ճ?|}�P������ջ?}}�P}������}���5�0�1t��������w����w����w넬�w���wK���w{���w����ۻ�B���j������.d-�/�S�.쮶Y���B���j������.d-쮶Y���B���j������.dm�����v!k�c������m�6vwۅ����v!kcw�]����m�vwۅ����v!�`��]�:�=m��3���B���,?h�{�{�.d잶Y���B���i�����i������B����Y�>�.d=��h�����B��?�����>�.d=��h������B����YO�>�.d=��l������B��϶YO�>������l����7~U���϶YO�>�.d���l������B����Y/��.d���j������B�������0��.d��U��Ű����B����Yo��.d���n������B���Yo��.d���n��������=��Yo��]�~��n������B����Y�~�.d}��i������B����Y�~�.d}��i�C����-aLP��5z �(.��).��*.��+.��,.��-.��..��/.�0.�1.#�2.3�3.B�Ҽ�ҫ�r�7�F�͜��t?�ΤM7�ΪY7�ΰe7�ζq7�μ}7���7�ȳ��yv��w[z7�'���=�FM�Ӻ7�n�O<+ݓ}�Y���J�ğxV���ĳ�=	(^�xS��Y��J���xV�'ų_f�m��m(�J�t�xV�'ų�=u(���	D�MěF�J�d�xV��ų�=�(����E��wI~��{��ų�=�(���iG�tO>��m@��xV�'"ų�=)���II�tOM�g�{�R<��U����ު��J�tOY�g�{�R�n��/ų�=�)���L�tOh�g�{ZS<+ݓ��Y���j|��W��7;o�S<+ݓ��u�7�)���	P�tO��g�{2T<+�S��Y��J���xV�'Ių_d�M���қ0��4�iS�tO��g�{
U<+���Y�N�J���xV��Vų�=�*���iV��9�	�7\o�U<+���Y�~�J�$�xV��bų�=!+���iY�tOΊg�{�V<+��⵬���9�9v��<��,Ǯ]t�xV��е�Yy�C׊g�]+��;t�xV��е�Yy�C׊g�	]+^ˮ]t�xV��kųi���ޮ]t�xV��kų�=]+����Z�tO׊g�{�V<+�ӵk�^ڵ��]� s�`z�9�0u�)�8Ɯ�d�~ez�93�i�Ǚ�<shz�9�4Ǚ����Tskz�96�ɦG�v����nڵˮ]t�xV��kų�=]+��8F�Y�v��kų�=]+����Z�tO׊g�{�V��]��Z�tO׊g�{�V<+�ӵ�Y鞮�j��{��{�vѵ�Y鞮�J�t�xV��k�kٵ���J�t�xV��kų�=]+����Z�tO׊g5.Qx�B�v��kų�=]+����Z�Zv��kų�=]+����Z�tO׊g�{�V<+�ӵ�Y鞮�j�a�����E׊g�{�V��]��Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�xV��kų�=]+�ոB�"�۵���e�.�V<+�ӵ�Y鞮�J�t�xV��kų�=]+����Z�tO׊g�{�V<�q��+\��k]+����Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�xV��kų�=]+����Z��v��x��+tv���D�-:�vӵ�Yy������tt�xVާ�kų�J]+�����Z�XG׊g��:�V��]��Z�tO׊g5�0z�Q�v��kų�=]+����Z�tO׊g�{�V<+�ӵ�Y鞮�m�n�V<+�ӵ�Y鞮�j� �
����M׊g�{�V<+�ӵ�Y鞮�J�t�xV��k���k�n�v�k��ޮw���qu׻���;�����������%�q�w\����;n�z�w���y��;����^�k����^�v۵���J�t�xV��kų�=]+�ո?�j�۵���J�t�xV��kų�=]+^ۮ�t�xV��kų�=]+����Z�tO׊g�{�V<�q}��뺷k7]+����Z�tO׊׶k7]+����Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�xV����to�n�V<+�ӵ���M׊g�{�V<+�ӵ�Y鞮�J�t�xV��kų�=]+����Z���_o�ޮ�t�xm�vӵ�Y鞮�J�t�xV��kų�=]+����Z�tO׊g�{�V<+�ӵ�Y��3>�ѽ]��Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�xV��kų�=]+����Z�tO׊ױk7]+��x���%�/ٵ����7Lt�xV>c�kų�%]+�����Z�|�D׊g�&�V<+_5ѵ�u��C׊g�{�V<��x��c��k]+����Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�x��е�Y鞮�J�t�xV�힏�to��V<+�ӵ�Y鞮�J�t�xV��kų�=]+^Ǯ=t�xV��kų�=]+����Z���I�N�ޮ=t�xV��kų�=]+����Z�tOמ�Rծ=t��U�kU��������/VǓ��f�G��ժ�}�:�Η�>]��x�����|u�_��x�:����u<b�X}�jמ�՗�v��k]+����Z�tO׊g�{�V<+�ӵ�Y��þֽ]{�Z�tO׊g�{�V��]{�Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�xV��kų�}��{��е�Y鞮�c��V<+�ӵ�Y鞮�J�t�xV��kų�=]+����Z�tO׊g5���n^�v��k��ص���J�t�xV��kų�=]+����Z�tO׊g�{�V<+�ӵ�Y鞮�j������k]+����Z�tO׊g�{�V<+�ӵ�Y鞮�J�t�xV��kų�=]+����Z�zص����QU�"u�]     