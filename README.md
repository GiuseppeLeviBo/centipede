# Centipede® Clone

A fully-featured arcade game tribute built with **React**, **TypeScript**, and **Canvas**, implementing the classic Centipede gameplay with modern enhancements.

🎮 **Play now**: [https://giuseppelevibo.github.io/centipede/](https://giuseppelevibo.github.io/centipede/)

## 🎮 About This Project

This project is a tribute to the iconic arcade game Centipede. It features faithful gameplay mechanics combined with modern quality-of-life improvements and extensible design patterns.

### Development Approach: AI-Assisted Iterative Development

This codebase showcases an innovative development methodology using **multiple AI systems** working collaboratively:

1. **Arena.ai** generated two distinct implementations for each feature request
2. **Human review** evaluated both versions based on appearance, functionality, and code quality
3. **ChatGPT 5.5** performed detailed code analysis and provided reasoned judgments on the superior approach
4. **Iterative refinement** repeated this cycle with new feature requests and bug fixes

The advantage of this multi-AI approach is that each system could compensate for and correct the errors of others, resulting in rapidly-developed, high-quality code.

**Note:** Final gameplay parameter tuning was done manually, as it requires human judgment about game feel and balance. You can freely adjust these values in `src/game/gameplay-config.ts` to customize the experience.

## Legal Notice

Centipede® is a registered trademark of Atari CORPORATION. This project is an independent tribute and is not affiliated with, sponsored by, or endorsed by Atari CORPORATION.

The source code in this repository is original project code. If you publish this game publicly, consider using an original title and describing it as a tribute or Centipede-inspired game.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for development)
- Modern web browser with Canvas support

### Installation

```bash
npm install
```

### Development

Run the development server with hot reload:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🎯 Game Features

- **Classic Centipede Gameplay**: Navigate your cannon through a mushroom field and destroy the descending centipede
- **Enemy Variety**: Spider, Flea, and Scorpion enemies with unique AI behaviors
- **Progressive Difficulty**: Increasing centipede speed, helper chains, and enemy spawn rates per level
- **Bonus Mushrooms**: Randomly appearing power-ups with special effects:
  - **Gold**: Random point bonus
  - **Gem**: 2× score multiplier
  - **Double/Triple Shot**: Enhanced firepower
  - **1-UP**: Extra life
  - **Depower**: Challenge modifier
  - **Monster Spawners**: Trigger special enemy encounters
- **Bomb Mushrooms**: Destructive explosions with area effects
- **High Score System**: Persistent leaderboard with localStorage
- **Responsive Design**: Pixel-perfect scaling on all screen sizes
- **Demo Mode**: Animated attract mode with AI-controlled gameplay
- **Touch/Pointer Support**: Works on tablets and mobile devices
- **PWA Support**: Install as a standalone app on any device

## 🎮 Controls

### Keyboard
- **Arrow Keys** or **WASD**: Move your cannon
- **Space**: Fire bullets
- Auto-fire: Hold Space for continuous shooting

### Mouse/Touch
- **Click and drag**: Move cannon to pointer location
- **Hold**: Fire bullets continuously
- Works on touchscreens and pen input

## ⚙️ Configuration

All gameplay parameters are centralized in `src/game/gameplay-config.ts`. You can customize:

- **Enemy behaviors**: spawn rates, speeds, attack patterns
- **Mushroom properties**: initial spawn chance, bomb probability
- **Difficulty scaling**: how stats change per level
- **Scoring**: points for kills and bonuses
- **Timing**: duration of power-ups and effects
- **Visual effects**: shake intensity, animation speeds

Example adjustment:

```typescript
// Increase centipede speed bonus per level
levelScaling: {
  centipede: {
    mainLengthReductionEveryLevels: 2,  // Reduce body length every 2 levels
    // ... other settings
  }
}
```

## 🏗️ Project Structure

```
src/
├── App.tsx                 # Main React component and input handling
├── main.tsx               # Entry point
├── index.css              # Global styles with Press Start 2P font
├── game/
│   ├── engine.ts          # Core game logic and state updates
│   ├── renderer.ts        # Canvas rendering for all game elements
│   ├── types.ts           # TypeScript interfaces
│   ├── constants.ts       # Numerical constants (speeds, scores, etc.)
│   ├── gameplay-config.ts # Centralized configuration object
│   ├── sprites.ts         # Drawing utility functions
│   └── audio.ts           # Sound effect synthesis
```

## 🎨 Technology Stack

- **React 19**: Component framework
- **TypeScript 5.9**: Type-safe development
- **Vite 7.3**: Lightning-fast build tool
- **Canvas 2D**: Direct rendering for performance
- **Tailwind CSS 4**: Utility-first styling
- **Web Audio API**: Procedural sound synthesis

## 🔄 Continuous Deployment with GitHub Actions

This project demonstrates the power of **GitHub Actions** for automated deployment:

- **Trigger**: Every push to the `main` branch automatically triggers the build pipeline
- **Build**: Node.js 22 environment installs dependencies and compiles the TypeScript/React codebase
- **Deploy**: Compiled assets are automatically published to **GitHub Pages** as a PWA
- **Live URL**: [https://giuseppelevibo.github.io/centipede/](https://giuseppelevibo.github.io/centipede/)

### Workflow Details

The `.github/workflows/deploy-pages.yml` workflow:

1. Checks out the repository
2. Sets up Node.js with dependency caching for faster builds
3. Installs npm dependencies (`npm ci`)
4. Builds the project (`npm run build`)
5. Uploads build artifacts to GitHub Pages
6. Deploys to the live URL

**Zero downtime deployments**: The workflow is configured with concurrency controls to prevent race conditions while maintaining a smooth deployment experience.

### PWA Installation

The application is a Progressive Web App (PWA), meaning you can:

- **Install on desktop**: "Install app" prompt in supported browsers
- **Install on mobile**: Add to home screen on iOS/Android
- **Work offline**: Service Worker enables caching for offline play
- **Standalone mode**: Launch as a full-screen app without browser UI

## 📊 Game Loop

The game runs at a fixed **60 FPS** update rate, independent of monitor refresh rate:

- **Input processing**: Keyboard, mouse, and touch events
- **Game state update**: Enemy AI, physics, collision detection
- **Rendering**: Canvas drawing with camera shake effects
- **State management**: React state for high-level control flow

This ensures consistent gameplay across devices with different refresh rates (60Hz, 120Hz, 144Hz, etc.).

## 🔊 Audio

Sound effects are generated procedurally using the Web Audio API:
- Blip sounds for shooting and enemies
- Explosion effects for bomb mushrooms
- Level clear and game over sounds

No external audio files required—everything is synthesized in real-time.

## 💾 Persistence

- **High Scores**: Stored in browser localStorage
- **Auto-save**: Scores are immediately persisted when achieved
- **Legacy Support**: Reads from both old and new high score formats

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

Requires Canvas 2D API and Web Audio API support.

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributing

This is a tribute project. While pull requests are welcome, please ensure:
- Code maintains the established style and patterns
- Changes preserve gameplay balance
- New features are configurable via `gameplay-config.ts`
- Commits trigger automated deployment—test locally first

## 🎓 Learning Resources

This codebase demonstrates:
- Fixed timestep game loops in TypeScript
- Canvas 2D rendering techniques
- React for game state management
- Procedural audio synthesis
- Collision detection algorithms
- AI behavior trees (spider, flea, scorpion)
- Dynamic difficulty scaling
- **GitHub Actions for CI/CD** (automated build and deployment)
- **PWA development** (service workers, manifest files, offline support)

## 🐛 Known Limitations

- Single-player only
- No persistent online leaderboards
- Audio synthesis may sound harsh (intentionally retro)

## 🙏 Acknowledgments

This project celebrates the legacy of the original Centipede arcade game and demonstrates how:
- Modern AI tools can collaborate to create complex interactive experiences
- GitHub Actions can streamline development workflows with zero-friction deployment
- Progressive Web Apps bring console-quality games to the browser

---

**Play the game**: [https://giuseppelevibo.github.io/centipede/](https://giuseppelevibo.github.io/centipede/)

**Customize the gameplay**: Edit `src/game/gameplay-config.ts` to adjust difficulty, scoring, and behavior parameters to your preference.

**Deploy your changes**: Push to `main` and watch the GitHub Action automatically build and deploy your updates to the live site.
