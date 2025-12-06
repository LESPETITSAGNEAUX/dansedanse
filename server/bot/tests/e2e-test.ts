
import { GGClubAdapter } from "../platforms/ggclub";
import { getDebugReplaySystem } from "../debug-replay";

export class E2ETest {
  private adapter: GGClubAdapter;
  private replaySystem = getDebugReplaySystem();

  constructor() {
    this.adapter = new GGClubAdapter();
  }

  async runFullCycle(): Promise<void> {
    console.log("[E2E] Starting full cycle test...");
    
    const sessionId = await this.replaySystem.startSession();
    const windowHandle = 1001;

    // 1. Connexion
    const connected = await this.adapter.connect({
      credentials: { username: "test", password: "test" },
      autoReconnect: false,
      maxReconnectAttempts: 0,
      reconnectDelayMs: 0,
    });

    if (!connected) {
      console.error("[E2E] Connection failed");
      return;
    }

    // 2. Détection de table
    const windows = await this.adapter.detectTableWindows();
    console.log(`[E2E] Detected ${windows.length} tables`);

    // 3. Capture d'état
    const gameState = await this.adapter.getGameState(windowHandle);
    console.log(`[E2E] Game state: ${JSON.stringify(gameState, null, 2)}`);

    // 4. Décision GTO (simulée)
    const action = gameState.isHeroTurn ? "fold" : "none";

    // 5. Enregistrer dans replay
    const screenshot = await this.adapter.captureScreen(windowHandle);
    await this.replaySystem.captureFrame(
      screenshot,
      gameState,
      { action, confidence: 0.8 },
      action,
      {},
      0.8
    );

    // 6. Déconnexion
    await this.adapter.disconnect();
    await this.replaySystem.saveSession();

    console.log(`[E2E] Test complete. Session: ${sessionId}`);
  }
}
