# Scripts d'installation - GTO Poker Bot

## Installation rapide sur Windows 11

### Methode 1 : Installation automatique (recommandee)

1. **Telecharger le projet** depuis Replit (ZIP) et extraire dans `C:\Users\VotreNom\poker-bot`
2. **Clic droit** sur `script\INSTALL.bat` > **Executer en tant qu'administrateur**
3. **Suivre les instructions** a l'ecran (installation ~10-15 min)
4. **Demarrer** avec `start-bot.bat`

Le script installe automatiquement :
- Tous les prerequis (Node.js, PostgreSQL, Git, Build Tools)
- Les dependances npm et modules natifs
- Initialise la base de donnees

### Methode 2 : PowerShell direct

```powershell
# Ouvrir PowerShell en Administrateur
Set-ExecutionPolicy Bypass -Scope Process -Force
.\script\install-windows.ps1
```

#### Options du script PowerShell

```powershell
# Installation personnalisee
.\install-windows.ps1 -InstallPath "D:\PokerBot" -PostgresPassword "MonMotDePasse"

# Sauter certaines installations
.\install-windows.ps1 -SkipPostgres   # Si PostgreSQL deja installe
.\install-windows.ps1 -SkipNodeJs     # Si Node.js deja installe
```

### Methode 3 : Prerequis d'abord, projet ensuite

Si vous voulez installer les prerequis AVANT de telecharger le projet :

1. Executer `INSTALL.bat` (il creera le dossier et le fichier .env)
2. Telecharger le projet et l'extraire dans le dossier indique
3. Re-executer `INSTALL.bat` (il detectera le projet et installera les dependances)

---

## Scripts disponibles

| Fichier | Description |
|---------|-------------|
| `INSTALL.bat` | Lanceur d'installation (double-clic) |
| `install-windows.ps1` | Script PowerShell complet |
| `start-bot.bat` | Demarrer le bot |
| `check-modules.bat` | Verifier les modules natifs |

---

## Ce que le script installe

1. **Chocolatey** - Gestionnaire de paquets Windows
2. **Node.js 20 LTS** - Runtime JavaScript
3. **PostgreSQL 16** - Base de donnees
4. **Git** - Controle de version
5. **Visual Studio Build Tools** - Compilation modules natifs
6. **Python 3** - Dependance pour certains modules

---

## Apres l'installation

### 1. Verifier les modules natifs

```batch
check-modules.bat
```

Modules requis :
- `tesseract.js` - Reconnaissance de caracteres (OCR)
- `screenshot-desktop` - Capture d'ecran
- `robotjs` - Controle souris/clavier
- `node-window-manager` - Detection des fenetres

### 2. Si un module echoue

```bash
# Reinstaller avec compilation
npm install robotjs --build-from-source
npm install screenshot-desktop --build-from-source
```

### 3. Demarrer le bot

```batch
start-bot.bat
```

Ou manuellement :
```bash
npm run dev
```

### 4. Acceder au dashboard

Ouvrir : http://localhost:5000

---

## Configuration PostgreSQL

Parametres par defaut :
- **Utilisateur** : `poker_bot`
- **Mot de passe** : `poker_bot_2024`
- **Base de donnees** : `poker_bot`
- **Port** : `5432`

Connection string :
```
postgresql://poker_bot:poker_bot_2024@localhost:5432/poker_bot
```

---

## Depannage

### "Le script ne se lance pas"
- Clic droit > Executer en tant qu'administrateur

### "npm install echoue"
```bash
# Nettoyer et reinstaller
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### "robotjs ne compile pas"
1. Installer Visual Studio Build Tools
2. Redemarrer le terminal
3. `npm install robotjs --build-from-source`

### "PostgreSQL ne demarre pas"
```bash
# Verifier le service
net start postgresql-x64-16
```

---

## Support

- Documentation complete : `DEPLOIEMENT_LOCAL.md`
- Logs du bot : Dashboard > Onglet Logs
