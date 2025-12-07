import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { 
  botSessions, 
  pokerTables, 
  handHistories, 
  actionLogs, 
  botStats,
  humanizerConfig,
  gtoConfig,
  platformConfig,
  users
} from "@shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

interface DatabaseReport {
  connection: {
    status: string;
    database?: string;
    user?: string;
  };
  tables: {
    botSessions: { total: number; active: number; recent: any[] };
    pokerTables: { total: number; active: number; recent: any[] };
    handHistories: { total: number; recent: any[] };
    actionLogs: { total: number; recent: any[] };
    botStats: { total: number; recent: any[] };
    users: { total: number; list: any[] };
    configs: {
      humanizer: any | null;
      gto: any | null;
      platform: any | null;
    };
  };
  statistics: {
    totalHandsPlayed: number;
    totalProfit: number;
    avgHandsPerSession: number;
    mostActiveTable: any | null;
    recentActivity: any[];
  };
}

async function inspectDatabase(): Promise<DatabaseReport> {
  console.log("🔍 Inspection de la base de données...\n");

  let connectionInfo = { status: "❌ Non connecté" };
  try {
    const result = await db.execute(sql`SELECT current_database() as db, current_user as user`);
    if (result.rows.length > 0) {
      connectionInfo = {
        status: "✅ Connecté",
        database: result.rows[0].db as string,
        user: result.rows[0].user as string,
      };
    }
  } catch (error: any) {
    console.error("❌ Erreur de connexion:", error.message);
    process.exit(1);
  }

  const allSessions = await db.select().from(botSessions).orderBy(desc(botSessions.startedAt));
  const activeSessions = allSessions.filter(s => s.status === "running");
  const recentSessions = allSessions.slice(0, 5);

  const allTables = await db.select().from(pokerTables).orderBy(desc(pokerTables.createdAt));
  const activeTables = allTables.filter(t => t.status === "playing" || t.status === "waiting");
  const recentTables = allTables.slice(0, 5);

  const allHands = await db.select().from(handHistories).orderBy(desc(handHistories.playedAt));
  const recentHands = allHands.slice(0, 10);

  const allLogs = await db.select().from(actionLogs).orderBy(desc(actionLogs.createdAt));
  const recentLogs = allLogs.slice(0, 20);

  const allStats = await db.select().from(botStats).orderBy(desc(botStats.updatedAt));
  const recentStats = allStats.slice(0, 5);

  const allUsers = await db.select().from(users);

  const humanizer = await db.select().from(humanizerConfig).limit(1);
  const gto = await db.select().from(gtoConfig).limit(1);
  const platform = await db.select().from(platformConfig).limit(1);

  const totalHandsPlayed = allHands.length;
  const totalProfit = allSessions.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
  const avgHandsPerSession = allSessions.length > 0 
    ? totalHandsPlayed / allSessions.length 
    : 0;

  let mostActiveTable = null;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActivity = await db
    .select()
    .from(actionLogs)
    .where(sql`created_at > ${oneDayAgo}`)
    .orderBy(desc(actionLogs.createdAt))
    .limit(10);

  const report: DatabaseReport = {
    connection: connectionInfo,
    tables: {
      botSessions: {
        total: allSessions.length,
        active: activeSessions.length,
        recent: recentSessions,
      },
      pokerTables: {
        total: allTables.length,
        active: activeTables.length,
        recent: recentTables,
      },
      handHistories: {
        total: allHands.length,
        recent: recentHands,
      },
      actionLogs: {
        total: allLogs.length,
        recent: recentLogs,
      },
      botStats: {
        total: allStats.length,
        recent: recentStats,
      },
      users: {
        total: allUsers.length,
        list: allUsers.map(u => ({ id: u.id, username: u.username })),
      },
      configs: {
        humanizer: humanizer[0] || null,
        gto: gto[0] || null,
        platform: platform[0] || null,
      },
    },
    statistics: {
      totalHandsPlayed,
      totalProfit,
      avgHandsPerSession: Math.round(avgHandsPerSession * 100) / 100,
      mostActiveTable,
      recentActivity,
    },
  };

  return report;
}

function displayReport(report: DatabaseReport): void {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 RAPPORT D'INSPECTION DE LA BASE DE DONNÉES");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("🔌 CONNEXION");
  console.log(`   Statut: ${report.connection.status}`);
  if (report.connection.database) {
    console.log(`   Base de données: ${report.connection.database}`);
    console.log(`   Utilisateur: ${report.connection.user}`);
  }
  console.log();

  console.log("📋 SESSIONS");
  console.log(`   Total: ${report.tables.botSessions.total}`);
  console.log(`   Actives: ${report.tables.botSessions.active}`);
  if (report.tables.botSessions.recent.length > 0) {
    console.log("\n   Sessions récentes:");
    report.tables.botSessions.recent.forEach((session, i) => {
      console.log(`   ${i + 1}. [${session.status}] ${session.id.substring(0, 8)}...`);
      console.log(`      Début: ${session.startedAt ? new Date(session.startedAt).toLocaleString('fr-FR') : 'N/A'}`);
      console.log(`      Mains: ${session.handsPlayed || 0} | Profit: ${session.totalProfit || 0}`);
    });
  }
  console.log();

  console.log("🎰 TABLES DE POKER");
  console.log(`   Total: ${report.tables.pokerTables.total}`);
  console.log(`   Actives: ${report.tables.pokerTables.active}`);
  if (report.tables.pokerTables.recent.length > 0) {
    console.log("\n   Tables récentes:");
    report.tables.pokerTables.recent.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.tableName} (${table.stakes})`);
      console.log(`      Statut: ${table.status} | ID: ${table.id.substring(0, 8)}...`);
    });
  }
  console.log();

  console.log("🃏 HISTORIQUE DES MAINS");
  console.log(`   Total: ${report.tables.handHistories.total}`);
  if (report.tables.handHistories.recent.length > 0) {
    console.log("\n   Dernières mains:");
    report.tables.handHistories.recent.slice(0, 5).forEach((hand, i) => {
      console.log(`   ${i + 1}. Main #${hand.handNumber}`);
      console.log(`      Cartes: ${hand.heroCards?.join(' ') || 'N/A'}`);
      console.log(`      Board: ${hand.communityCards?.join(' ') || 'N/A'}`);
      console.log(`      Résultat: ${hand.result || 0} | Date: ${new Date(hand.playedAt).toLocaleString('fr-FR')}`);
    });
  }
  console.log();

  console.log("📝 LOGS D'ACTIONS");
  console.log(`   Total: ${report.tables.actionLogs.total}`);
  if (report.tables.actionLogs.recent.length > 0) {
    console.log("\n   Logs récents:");
    report.tables.actionLogs.recent.slice(0, 10).forEach((log, i) => {
      const time = new Date(log.createdAt).toLocaleTimeString('fr-FR');
      console.log(`   ${i + 1}. [${time}] [${log.logType}] ${log.message}`);
    });
  }
  console.log();

  console.log("📈 STATISTIQUES GLOBALES");
  console.log(`   Total mains jouées: ${report.statistics.totalHandsPlayed}`);
  console.log(`   Profit total: ${report.statistics.totalProfit.toFixed(2)}`);
  console.log(`   Moyenne mains/session: ${report.statistics.avgHandsPerSession}`);
  if (report.statistics.mostActiveTable) {
    console.log(`   Table la plus active: ${report.statistics.mostActiveTable.tableName} (${report.statistics.mostActiveTable.handsPlayed} mains)`);
  }
  console.log();

  console.log("⚙️ CONFIGURATIONS");
  console.log(`   Humanizer: ${report.tables.configs.humanizer ? '✅ Configuré' : '❌ Non configuré'}`);
  if (report.tables.configs.humanizer) {
    const h = report.tables.configs.humanizer;
    console.log(`      Délais: ${h.minDelayMs}ms - ${h.maxDelayMs}ms`);
    console.log(`      Mode furtif: ${h.stealthModeEnabled ? 'Oui' : 'Non'}`);
  }
  console.log(`   GTO: ${report.tables.configs.gto ? '✅ Configuré' : '❌ Non configuré'}`);
  if (report.tables.configs.gto) {
    const g = report.tables.configs.gto;
    console.log(`      Activé: ${g.enabled ? 'Oui' : 'Non'}`);
    console.log(`      API: ${g.apiKey ? '✅ Clé présente' : '❌ Pas de clé'}`);
    console.log(`      Simulation: ${g.fallbackToSimulation ? 'Oui' : 'Non'}`);
  }
  console.log(`   Plateforme: ${report.tables.configs.platform ? '✅ Configuré' : '❌ Non configuré'}`);
  if (report.tables.configs.platform) {
    const p = report.tables.configs.platform;
    console.log(`      Plateforme: ${p.platformName || 'N/A'}`);
    console.log(`      Statut: ${p.connectionStatus || 'N/A'}`);
    console.log(`      Activé: ${p.enabled ? 'Oui' : 'Non'}`);
  }
  console.log();

  console.log("👥 UTILISATEURS");
  console.log(`   Total: ${report.tables.users.total}`);
  if (report.tables.users.list.length > 0) {
    report.tables.users.list.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.username} (${user.id.substring(0, 8)}...)`);
    });
  }
  console.log();

  if (report.statistics.recentActivity.length > 0) {
    console.log("🕐 ACTIVITÉ RÉCENTE (24h)");
    report.statistics.recentActivity.forEach((activity, i) => {
      const time = new Date(activity.createdAt).toLocaleString('fr-FR');
      console.log(`   ${i + 1}. [${time}] [${activity.logType}] ${activity.message}`);
    });
    console.log();
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Inspection terminée");
  console.log("═══════════════════════════════════════════════════════════\n");
}

async function main() {
  try {
    const report = await inspectDatabase();
    displayReport(report);
    
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    }
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erreur lors de l'inspection:", error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

main();
