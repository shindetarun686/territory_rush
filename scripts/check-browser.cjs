const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    if (process.argv.includes('--reference')) {
      await page.goto('https://paperio.site/teams/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'reference.png' });
      await page.evaluate(() => window.StartGame());
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'reference-game.png' });
      console.log(await page.title());
      return;
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/');
    await page.screenshot({ path: 'dashboard-desktop.png' });
    await page.locator('#btnMenuPlay').click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.locator('#btnResume').waitFor({ state: 'visible' });
    await page.screenshot({ path: 'paused-desktop.png' });
    await page.locator('#btnResume').click();
    await page.screenshot({ path: 'game-desktop.png' });
    const checks = await page.evaluate(async () => {
      const { GameManager } = await import('/src/game/game.js');
      const { storage } = await import('/src/game/storage.js');
      const { WorldGrid } = await import('/src/game/world.js');
      const saved = JSON.stringify(storage.data);
      const game = new GameManager(document.createElement('canvas'));
      try {
        game.startMatch();
        const counts = [1, 2, 3, 4].map(id => game.ais.filter(ai => ai.teamId === id).length + (id === 1 ? 1 : 0));
        if (counts.some(count => count !== 3)) throw new Error('Unbalanced teams');
        const friend = game.ais.find(ai => ai.teamId === 1);
        const before = game.world.cellCounts[1];
        const enemy = game.ais.find(ai => ai.teamId === 2);
        game.handleElimination(enemy, friend);
        if (game.world.cellCounts[1] !== before) throw new Error('Teammate death removed shared land');
        if (game.respawnQueue[0].teamId !== 1) throw new Error('Respawn changed team');
        const home = game.world.gridToWorld(80, 38);
        game.player.x = home.wx;
        game.player.y = home.wy;
        game.player.trail = [{x: home.wx, y: home.wy}, {x: home.wx + 150, y: home.wy}, {x: home.wx + 150, y: home.wy + 150}];
        game.player.isOutside = true;
        const ally = game.ais.find(ai => ai.alive && ai.teamId === 1);
        ally.x = home.wx;
        ally.y = home.wy;
        game.checkCombatCollisions();
        if (!game.player.alive) throw new Error('Friendly fire');
        enemy.x = home.wx;
        enemy.y = home.wy;
        game.checkCombatCollisions();
        if (game.player.alive || game.state !== 'GAMEOVER') throw new Error('Enemy trail cut did not eliminate player');
        const world = new WorldGrid();
        world.spawnInitialTerritory(1, 2000, 2000, 5);
        const capture = world.captureTerritory(1, [
          { x: 2000, y: 2000 }, { x: 2350, y: 2000 },
          { x: 2350, y: 2350 }, { x: 2000, y: 2350 }, { x: 2000, y: 2000 }
        ]);
        const inside = world.worldToGrid(2200, 2200);
        if (capture.captured <= 0 || world.getCell(inside.gx, inside.gy) !== 1) throw new Error('Closed loop did not capture its interior');
        if (world.grid.some((owner, index) => owner && !world.playableMask[index])) throw new Error('Captured outside circle');
        game.territoryPercent = '100.00';
        game.startMatch();
        if (game.ais.length !== 11) throw new Error('Restart lost bots');
        const data = document.getElementById('gameCanvas').getContext('2d').getImageData(0, 0, 300, 300).data;
        if (!data.some(value => value > 0)) throw new Error('Blank canvas');
        return { teams: counts, restartBots: game.ais.length, captureCells: capture.captured, enemyCut: 'passed', canvas: 'nonblank' };
      } finally {
        storage.data = JSON.parse(saved);
        storage.save();
      }
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.screenshot({ path: 'dashboard-mobile.png', fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error('Mobile horizontal overflow');
    await page.locator('#btnMenuPlay').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'game-mobile.png' });
    const pauseBounds = await page.locator('#btnPause').boundingBox();
    if (!pauseBounds || pauseBounds.x + pauseBounds.width > 390) throw new Error('Pause control clipped');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(JSON.stringify({ ...checks, errors, mobileOverflow: overflow }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
