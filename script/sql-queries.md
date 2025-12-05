# 📊 Requêtes SQL Utiles pour la Base de Données

## 🔌 Connexion à PostgreSQL

```bash
# Windows (PowerShell)
psql -U poker_bot -d poker_bot -h localhost

# Ou avec mot de passe dans la commande
$env:PGPASSWORD="poker_bot_2024"; psql -U poker_bot -d poker_bot -h localhost
```

---

## 📋 Requêtes de Base

### Voir toutes les tables
```sql
\dt
```

### Voir la structure d'une table
```sql
\d bot_sessions
\d poker_tables
\d hand_histories
```

### Compter les enregistrements
```sql
SELECT COUNT(*) FROM bot_sessions;
SELECT COUNT(*) FROM poker_tables;
SELECT COUNT(*) FROM hand_histories;
SELECT COUNT(*) FROM action_logs;
```

---

## 📊 SESSIONS

### Sessions actives
```sql
SELECT 
  id,
  status,
  started_at,
  total_profit,
  hands_played,
  tables_active
FROM bot_sessions
WHERE status = 'running'
ORDER BY started_at DESC;
```

### Toutes les sessions avec statistiques
```sql
SELECT 
  id,
  status,
  started_at,
  stopped_at,
  total_profit,
  hands_played,
  tables_active,
  EXTRACT(EPOCH FROM (stopped_at - started_at)) / 60 as duration_minutes
FROM bot_sessions
ORDER BY started_at DESC
LIMIT 20;
```

### Session la plus profitable
```sql
SELECT 
  id,
  started_at,
  total_profit,
  hands_played,
  ROUND(total_profit / NULLIF(hands_played, 0), 2) as profit_per_hand
FROM bot_sessions
WHERE total_profit IS NOT NULL
ORDER BY total_profit DESC
LIMIT 1;
```

---

## 🎰 TABLES DE POKER

### Tables actives
```sql
SELECT 
  id,
  table_name,
  stakes,
  status,
  hero_position,
  hero_stack,
  current_pot,
  current_street,
  created_at
FROM poker_tables
WHERE status IN ('playing', 'waiting')
ORDER BY created_at DESC;
```

### Tables par session
```sql
SELECT 
  bs.id as session_id,
  bs.started_at,
  COUNT(pt.id) as table_count,
  SUM(CASE WHEN pt.status = 'playing' THEN 1 ELSE 0 END) as active_tables
FROM bot_sessions bs
LEFT JOIN poker_tables pt ON pt.session_id = bs.id
GROUP BY bs.id, bs.started_at
ORDER BY bs.started_at DESC;
```

### Table avec le plus de mains
```sql
SELECT 
  pt.table_name,
  pt.stakes,
  COUNT(hh.id) as hands_played,
  SUM(hh.result) as total_profit
FROM poker_tables pt
LEFT JOIN hand_histories hh ON hh.table_id = pt.id
GROUP BY pt.id, pt.table_name, pt.stakes
ORDER BY hands_played DESC
LIMIT 10;
```

---

## 🃏 HISTORIQUE DES MAINS

### Dernières mains jouées
```sql
SELECT 
  hh.hand_number,
  hh.hero_cards,
  hh.community_cards,
  hh.hero_position,
  hh.result,
  hh.actual_action,
  pt.table_name,
  hh.played_at
FROM hand_histories hh
LEFT JOIN poker_tables pt ON pt.id = hh.table_id
ORDER BY hh.played_at DESC
LIMIT 20;
```

### Mains gagnantes vs perdantes
```sql
SELECT 
  CASE 
    WHEN result > 0 THEN 'Gagnante'
    WHEN result < 0 THEN 'Perdante'
    ELSE 'Égalité'
  END as result_type,
  COUNT(*) as count,
  SUM(result) as total_profit,
  AVG(result) as avg_profit
FROM hand_histories
WHERE result IS NOT NULL
GROUP BY result_type;
```

### Meilleures mains
```sql
SELECT 
  hand_number,
  hero_cards,
  community_cards,
  result,
  played_at
FROM hand_histories
WHERE result > 0
ORDER BY result DESC
LIMIT 10;
```

### Analyse par position
```sql
SELECT 
  hero_position,
  COUNT(*) as hands_played,
  SUM(result) as total_profit,
  AVG(result) as avg_profit,
  COUNT(CASE WHEN result > 0 THEN 1 END) as winning_hands
FROM hand_histories
WHERE hero_position IS NOT NULL
GROUP BY hero_position
ORDER BY hero_position;
```

---

## 📝 LOGS D'ACTIONS

### Logs récents
```sql
SELECT 
  log_type,
  message,
  metadata,
  created_at
FROM action_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Logs par type
```sql
SELECT 
  log_type,
  COUNT(*) as count
FROM action_logs
GROUP BY log_type
ORDER BY count DESC;
```

### Logs d'erreurs
```sql
SELECT 
  message,
  metadata,
  created_at
FROM action_logs
WHERE log_type = 'error'
ORDER BY created_at DESC
LIMIT 20;
```

### Activité par heure
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as log_count
FROM action_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## 📈 STATISTIQUES

### Statistiques globales
```sql
SELECT 
  COUNT(DISTINCT bs.id) as total_sessions,
  COUNT(DISTINCT pt.id) as total_tables,
  COUNT(hh.id) as total_hands,
  SUM(bs.total_profit) as total_profit,
  AVG(bs.hands_played) as avg_hands_per_session
FROM bot_sessions bs
LEFT JOIN poker_tables pt ON pt.session_id = bs.id
LEFT JOIN hand_histories hh ON hh.session_id = bs.id;
```

### Performance par jour
```sql
SELECT 
  DATE(bs.started_at) as date,
  COUNT(DISTINCT bs.id) as sessions,
  SUM(bs.hands_played) as hands_played,
  SUM(bs.total_profit) as total_profit,
  AVG(bs.total_profit) as avg_profit_per_session
FROM bot_sessions bs
WHERE bs.started_at IS NOT NULL
GROUP BY DATE(bs.started_at)
ORDER BY date DESC
LIMIT 30;
```

### Taux de victoire
```sql
SELECT 
  COUNT(*) as total_hands,
  COUNT(CASE WHEN result > 0 THEN 1 END) as winning_hands,
  COUNT(CASE WHEN result < 0 THEN 1 END) as losing_hands,
  ROUND(100.0 * COUNT(CASE WHEN result > 0 THEN 1 END) / COUNT(*), 2) as win_rate_percent,
  SUM(result) as total_profit
FROM hand_histories
WHERE result IS NOT NULL;
```

---

## ⚙️ CONFIGURATIONS

### Configuration Humanizer
```sql
SELECT * FROM humanizer_config LIMIT 1;
```

### Configuration GTO
```sql
SELECT 
  enabled,
  api_endpoint,
  CASE WHEN api_key IS NOT NULL THEN '***' ELSE NULL END as has_api_key,
  fallback_to_simulation,
  cache_enabled
FROM gto_config
LIMIT 1;
```

### Configuration Plateforme
```sql
SELECT 
  platform_name,
  username,
  enabled,
  connection_status,
  last_connection_at
FROM platform_config
LIMIT 1;
```

---

## 🔍 REQUÊTES AVANCÉES

### Tables avec problèmes
```sql
SELECT 
  pt.id,
  pt.table_name,
  pt.status,
  COUNT(CASE WHEN al.log_type = 'error' THEN 1 END) as error_count,
  MAX(al.created_at) as last_error
FROM poker_tables pt
LEFT JOIN action_logs al ON al.table_id = pt.id
WHERE pt.status = 'error' OR al.log_type = 'error'
GROUP BY pt.id, pt.table_name, pt.status
ORDER BY error_count DESC;
```

### Analyse des actions GTO
```sql
SELECT 
  hh.hero_position,
  hh.current_street,
  hh.gto_recommendation->>'bestAction' as recommended_action,
  hh.actual_action,
  hh.result,
  COUNT(*) as count
FROM hand_histories hh
WHERE hh.gto_recommendation IS NOT NULL
GROUP BY 
  hh.hero_position,
  hh.current_street,
  hh.gto_recommendation->>'bestAction',
  hh.actual_action,
  hh.result
ORDER BY count DESC
LIMIT 20;
```

### Performance par street
```sql
SELECT 
  current_street,
  COUNT(*) as hands_played,
  SUM(result) as total_profit,
  AVG(result) as avg_profit,
  COUNT(CASE WHEN result > 0 THEN 1 END) as winning_hands
FROM hand_histories
WHERE current_street IS NOT NULL
GROUP BY current_street
ORDER BY 
  CASE current_street
    WHEN 'preflop' THEN 1
    WHEN 'flop' THEN 2
    WHEN 'turn' THEN 3
    WHEN 'river' THEN 4
  END;
```

### Nettoyage (ATTENTION: supprime des données!)
```sql
-- Supprimer les sessions anciennes (>30 jours)
DELETE FROM bot_sessions 
WHERE started_at < NOW() - INTERVAL '30 days' 
AND status = 'stopped';

-- Supprimer les logs anciens (>7 jours)
DELETE FROM action_logs 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Voir l'espace utilisé avant de supprimer
SELECT 
  pg_size_pretty(pg_total_relation_size('bot_sessions')) as sessions_size,
  pg_size_pretty(pg_total_relation_size('action_logs')) as logs_size,
  pg_size_pretty(pg_total_relation_size('hand_histories')) as hands_size;
```

---

## 🛠️ MAINTENANCE

### Taille de la base de données
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index existants
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Vérifier l'intégrité
```sql
-- Vérifier les références orphelines
SELECT COUNT(*) as orphaned_hands
FROM hand_histories hh
LEFT JOIN poker_tables pt ON pt.id = hh.table_id
WHERE hh.table_id IS NOT NULL AND pt.id IS NULL;
```

---

## 💡 ASTUCES

### Exporter en CSV
```sql
\copy (SELECT * FROM bot_sessions) TO 'sessions.csv' CSV HEADER;
```

### Voir les dernières commandes
```sql
-- Dans psql
\s
```

### Quitter psql
```sql
\q
```

---

## ⚠️ ATTENTION

- **Ne jamais supprimer** les configurations (`humanizer_config`, `gto_config`, `platform_config`)
- **Faire des backups** avant de supprimer des données
- **Tester les requêtes** sur une copie de la base avant de les exécuter en production
