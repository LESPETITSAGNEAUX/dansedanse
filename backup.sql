--
-- PostgreSQL database dump
--

\restrict WDvY9aj1M9HPEa0JjMKmdoumGUYgFUnBFfwbydusSeXrxdjZu7AWGwO4BRpD4Wi

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.action_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying,
    table_id character varying,
    log_type text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.action_logs OWNER TO neondb_owner;

--
-- Name: bot_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bot_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'stopped'::text NOT NULL,
    started_at timestamp without time zone,
    stopped_at timestamp without time zone,
    total_profit real DEFAULT 0,
    hands_played integer DEFAULT 0,
    tables_active integer DEFAULT 0
);


ALTER TABLE public.bot_sessions OWNER TO neondb_owner;

--
-- Name: bot_stats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bot_stats (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying,
    hands_per_hour integer DEFAULT 0,
    bb_per_100 real DEFAULT 0,
    gto_precision real DEFAULT 0,
    vpip real DEFAULT 0,
    pfr real DEFAULT 0,
    aggression real DEFAULT 0,
    win_rate real DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bot_stats OWNER TO neondb_owner;

--
-- Name: gto_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gto_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    api_endpoint text,
    api_key text,
    enabled boolean DEFAULT false NOT NULL,
    fallback_to_simulation boolean DEFAULT true NOT NULL,
    cache_enabled boolean DEFAULT true NOT NULL,
    max_cache_age integer DEFAULT 3600
);


ALTER TABLE public.gto_config OWNER TO neondb_owner;

--
-- Name: hand_histories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.hand_histories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    table_id character varying,
    session_id character varying,
    hand_number text NOT NULL,
    hero_cards text[],
    community_cards text[],
    hero_position text,
    actions jsonb,
    gto_recommendation jsonb,
    actual_action text,
    result real,
    ev_difference real,
    played_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.hand_histories OWNER TO neondb_owner;

--
-- Name: humanizer_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.humanizer_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    min_delay_ms integer DEFAULT 1500 NOT NULL,
    max_delay_ms integer DEFAULT 4200 NOT NULL,
    enable_bezier_mouse boolean DEFAULT true NOT NULL,
    enable_misclicks boolean DEFAULT false NOT NULL,
    misclick_probability real DEFAULT 0.0001,
    enable_random_folds boolean DEFAULT false NOT NULL,
    random_fold_probability real DEFAULT 0.001,
    thinking_time_variance real DEFAULT 0.3,
    pre_action_delay integer DEFAULT 500,
    post_action_delay integer DEFAULT 300,
    stealth_mode_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.humanizer_config OWNER TO neondb_owner;

--
-- Name: platform_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.platform_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    platform_name text NOT NULL,
    username text,
    enabled boolean DEFAULT false NOT NULL,
    connection_status text DEFAULT 'disconnected'::text,
    last_connection_at timestamp without time zone,
    settings jsonb
);


ALTER TABLE public.platform_config OWNER TO neondb_owner;

--
-- Name: poker_tables; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.poker_tables (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying,
    table_identifier text NOT NULL,
    table_name text NOT NULL,
    stakes text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    hero_position integer,
    hero_stack real,
    current_pot real DEFAULT 0,
    hero_cards text[],
    community_cards text[],
    current_street text DEFAULT 'preflop'::text,
    players_data jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.poker_tables OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: action_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.action_logs (id, session_id, table_id, log_type, message, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: bot_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bot_sessions (id, status, started_at, stopped_at, total_profit, hands_played, tables_active) FROM stdin;
\.


--
-- Data for Name: bot_stats; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bot_stats (id, session_id, hands_per_hour, bb_per_100, gto_precision, vpip, pfr, aggression, win_rate, updated_at) FROM stdin;
\.


--
-- Data for Name: gto_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gto_config (id, api_endpoint, api_key, enabled, fallback_to_simulation, cache_enabled, max_cache_age) FROM stdin;
009a93fe-7448-4aa3-87ac-876ea6332d03	\N	\N	f	t	t	3600
\.


--
-- Data for Name: hand_histories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.hand_histories (id, table_id, session_id, hand_number, hero_cards, community_cards, hero_position, actions, gto_recommendation, actual_action, result, ev_difference, played_at) FROM stdin;
\.


--
-- Data for Name: humanizer_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.humanizer_config (id, min_delay_ms, max_delay_ms, enable_bezier_mouse, enable_misclicks, misclick_probability, enable_random_folds, random_fold_probability, thinking_time_variance, pre_action_delay, post_action_delay, stealth_mode_enabled) FROM stdin;
\.


--
-- Data for Name: platform_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.platform_config (id, platform_name, username, enabled, connection_status, last_connection_at, settings) FROM stdin;
\.


--
-- Data for Name: poker_tables; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.poker_tables (id, session_id, table_identifier, table_name, stakes, status, hero_position, hero_stack, current_pot, hero_cards, community_cards, current_street, players_data, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password) FROM stdin;
\.


--
-- Name: action_logs action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_pkey PRIMARY KEY (id);


--
-- Name: bot_sessions bot_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bot_sessions
    ADD CONSTRAINT bot_sessions_pkey PRIMARY KEY (id);


--
-- Name: bot_stats bot_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bot_stats
    ADD CONSTRAINT bot_stats_pkey PRIMARY KEY (id);


--
-- Name: gto_config gto_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gto_config
    ADD CONSTRAINT gto_config_pkey PRIMARY KEY (id);


--
-- Name: hand_histories hand_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hand_histories
    ADD CONSTRAINT hand_histories_pkey PRIMARY KEY (id);


--
-- Name: humanizer_config humanizer_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.humanizer_config
    ADD CONSTRAINT humanizer_config_pkey PRIMARY KEY (id);


--
-- Name: platform_config platform_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.platform_config
    ADD CONSTRAINT platform_config_pkey PRIMARY KEY (id);


--
-- Name: poker_tables poker_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.poker_tables
    ADD CONSTRAINT poker_tables_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: action_logs action_logs_session_id_bot_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_session_id_bot_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.bot_sessions(id);


--
-- Name: action_logs action_logs_table_id_poker_tables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_table_id_poker_tables_id_fk FOREIGN KEY (table_id) REFERENCES public.poker_tables(id);


--
-- Name: bot_stats bot_stats_session_id_bot_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bot_stats
    ADD CONSTRAINT bot_stats_session_id_bot_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.bot_sessions(id);


--
-- Name: hand_histories hand_histories_session_id_bot_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hand_histories
    ADD CONSTRAINT hand_histories_session_id_bot_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.bot_sessions(id);


--
-- Name: hand_histories hand_histories_table_id_poker_tables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hand_histories
    ADD CONSTRAINT hand_histories_table_id_poker_tables_id_fk FOREIGN KEY (table_id) REFERENCES public.poker_tables(id);


--
-- Name: poker_tables poker_tables_session_id_bot_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.poker_tables
    ADD CONSTRAINT poker_tables_session_id_bot_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.bot_sessions(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict WDvY9aj1M9HPEa0JjMKmdoumGUYgFUnBFfwbydusSeXrxdjZu7AWGwO4BRpD4Wi

