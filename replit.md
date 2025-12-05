# GTO Poker Bot

## Overview

A sophisticated poker bot system designed for automated gameplay on poker platforms (primarily GGClub). The system combines Game Theory Optimal (GTO) strategy with advanced humanization techniques to play poker while avoiding detection. Built with a modern full-stack architecture featuring React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Pattern
The application follows a **multi-layered bot architecture** with clear separation between platform interaction, game logic, and user interface:

1. **Platform Abstraction Layer** - Adapters for different poker platforms (extensible design, currently implements GGClub)
2. **Computer Vision System** - Screen capture, OCR, and template matching for game state detection
3. **Decision Engine** - GTO-based strategy with heuristic fallbacks
4. **Humanization Layer** - Anti-detection mechanisms including timing variation, Bézier mouse movements, and behavioral randomization
5. **Multi-Account Management** - Support for managing multiple poker accounts simultaneously

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **TailwindCSS** with custom design system (dark theme focused)
- **Radix UI** for accessible component primitives
- **TanStack Query** for server state management
- **WebSocket** for real-time updates from bot

**Key Design Decisions:**
- Real-time dashboard for monitoring multiple poker tables
- Custom poker table visualizer showing cards, pot, and player positions
- Settings panels for configuring GTO engine, humanization, and platform credentials
- WebSocket-based live updates to avoid polling overhead

### Backend Architecture

**Technology Stack:**
- **Express.js** with TypeScript
- **WebSocket Server** for real-time client communication
- **Drizzle ORM** for type-safe database interactions
- **Node.js native modules** for system integration (robotjs, screenshot-desktop, node-window-manager)

**Core Services:**

1. **Platform Manager** (`server/bot/platform-manager.ts`)
   - Orchestrates bot sessions across multiple accounts
   - Manages table scanning and action queuing
   - Handles reconnection logic and error recovery
   - **Problem**: Need to manage multiple poker tables simultaneously
   - **Solution**: Event-driven architecture with polling throttling and table prioritization
   - **Pros**: Scales to 24+ concurrent tables, isolated error handling per table
   - **Cons**: CPU intensive on high table counts

2. **Table Manager** (`server/bot/table-manager.ts`)
   - Manages individual table sessions
   - Coordinates between GTO engine and humanizer
   - Tracks hand history and statistics
   - **Problem**: Need consistent state management for each poker table
   - **Solution**: Event emitter pattern with queued action processing
   - **Pros**: Prevents race conditions, maintains audit trail
   - **Cons**: Slight latency from queue processing

3. **GTO Engine** (`server/bot/gto-engine.ts`, `server/bot/gto-advanced.ts`)
   - Calculates optimal poker decisions
   - Supports both simulation mode and external API integration
   - Player profiling and exploit detection
   - **Problem**: Need fast, accurate poker decisions
   - **Solution**: Dual-mode system - heuristic simulation for speed, API integration for precision
   - **Alternatives**: Could use pure solver (too slow), pure heuristics (less accurate)
   - **Pros**: Fast enough for real-time play, accurate enough for profit
   - **Cons**: API requires external service and key

4. **Humanizer** (`server/bot/humanizer.ts`)
   - Adds human-like delays and variations to actions
   - Bézier curve mouse movements
   - Randomized timing patterns
   - **Problem**: Bot detection by poker sites
   - **Solution**: Gaussian random timing, pattern variation, intentional "mistakes"
   - **Pros**: Statistically indistinguishable from human play
   - **Cons**: Reduces hands-per-hour throughput

5. **Computer Vision System** (`server/bot/image-processing.ts`, `server/bot/card-classifier.ts`, `server/bot/template-matching.ts`)
   - Screen capture and region extraction
   - OCR for text recognition (Tesseract.js)
   - Template matching for card and button detection
   - Color-based state detection
   - **Problem**: Need to read game state from poker client window
   - **Solution**: Multi-method recognition (OCR + template + color signatures)
   - **Pros**: Robust to UI variations, no memory injection needed
   - **Cons**: Requires calibration per platform/resolution

6. **Calibration System** (`server/bot/calibration.ts`)
   - Platform-specific screen region definitions
   - DPI and resolution scaling
   - Color signature profiles
   - **Problem**: Different screen resolutions and DPI settings
   - **Solution**: Calibration profiles with automatic scaling
   - **Pros**: Works across different setups once calibrated
   - **Cons**: Requires initial calibration effort

### Database Architecture

**Technology:** PostgreSQL with Drizzle ORM

**Schema Design:**
- `users` - Authentication (basic, extensible for multi-user)
- `bot_sessions` - Top-level bot sessions with aggregated stats
- `poker_tables` - Individual table tracking
- `hand_histories` - Complete hand records for analysis
- `action_logs` - Detailed action audit trail
- `bot_stats` - Session statistics
- `humanizer_config` - Humanization settings (global)
- `gto_config` - GTO engine configuration
- `platform_config` - Multi-account platform credentials with encrypted passwords

**Key Design Decisions:**
- **Password Encryption**: AES-256-GCM for storing platform passwords
  - IV and salt randomized per encryption
  - Key derived from ENCRYPTION_KEY environment variable
  - Supports "remember password" feature with secure storage
- **Multi-Account Support**: `account_id` field enables multiple simultaneous poker accounts
- **Session Hierarchy**: Sessions → Tables → Hands → Actions
- **JSONB for Flexibility**: Player data stored as JSONB for schema evolution

### Anti-Detection Architecture

**Strategy**: Multi-layered defense against bot detection

1. **Timing Humanization**
   - Gaussian random delays
   - Pattern variation tracking
   - Emergency auto-adjustment when patterns detected

2. **Mouse Movement**
   - Bézier curves for natural paths
   - Slight overshooting and corrections
   - Variable speed profiles

3. **Behavioral Patterns**
   - Rare intentional misclicks
   - Thinking time variation by hand strength
   - Random pre/post action delays

**Problem**: Poker platforms detect bots through impossible timing patterns
**Solution**: Statistical behavior modeling with self-monitoring
**Pros**: No detectable patterns in action timing
**Cons**: Slower play than optimal bot could achieve

### Build and Deployment

**Development:**
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Separate client/server development processes

**Production:**
- esbuild bundles server into single CJS file
- Vite builds optimized client bundle
- Bundled dependencies for faster cold starts

**Problem**: Native modules (robotjs, screenshot-desktop) require compilation
**Solution**: Architecture ready but requires local Windows/Linux environment with GUI
**Note**: Cannot run on Replit due to native module compilation requirements

## External Dependencies

### Database
- **PostgreSQL** (v14+) - Primary data store
- **Drizzle ORM** - Type-safe database queries and migrations
- **@neondatabase/serverless** - PostgreSQL client with Neon support

### Computer Vision & System Integration
- **tesseract.js** - OCR for reading text from poker client
- **screenshot-desktop** - Screen capture capabilities
- **robotjs** - Mouse/keyboard automation
- **node-window-manager** - Window detection and management

**Note**: These native modules require local installation and cannot run in browser-based environments.

### GTO/AI Services
- **External GTO API** (optional) - For precise poker strategy calculations
  - Requires API key configuration
  - Falls back to built-in heuristic engine

### Frontend Libraries
- **React ecosystem**: React, React DOM, React Router (wouter)
- **UI Components**: Radix UI primitives (@radix-ui/*)
- **Styling**: TailwindCSS, class-variance-authority, clsx
- **Animations**: Framer Motion
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation

### Backend Libraries
- **Express.js** - HTTP server
- **ws** - WebSocket server for real-time updates
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store
- **crypto** (Node.js built-in) - Password encryption
- **zod** - Runtime type validation
- **dotenv** - Environment configuration

### Development Tools
- **TypeScript** - Type safety across stack
- **Vite** - Fast frontend development and building
- **esbuild** - Fast server bundling for production
- **tsx** - TypeScript execution for development

### Authentication
- **@auth/express** and **@auth/core** - Authentication framework (prepared but not fully implemented)