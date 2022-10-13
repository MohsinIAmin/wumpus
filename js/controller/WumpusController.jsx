
const WumpusController = {
  constants: {
    clear: 0,
    pit: 1,
    wumpus: 2,
    gold: 3,
    breeze: 4,
    stench: 5,
    glitter: 6,
    question: 7,
    pittile: 9,
    crossbones: 10,
  },

  generate: (width, height) => {
    const rows = [];
    const pits = [];
    let wumpus = { x: 0, y: height - 1 };
    let gold = { x: 0, y: height - 1 };
    let attempts;

    attempts = 0;
    while (gold.x === 0 && gold.y === height - 1 && attempts++ < 1000) {
      gold = { x: Math.floor(Math.random() * (width - 1)), y: Math.floor(Math.random() * (height - 1)) };
    }

    if (attempts >= 1000) {
      const msg = `Failed to generate gold location, due to grid size ${width},${height}`;
      console.error(msg);
      throw new Error(msg)
    }

    attempts = 0;
    while (((wumpus.x === 0 && wumpus.y === height - 1) || (wumpus.x === gold.x && wumpus.y === gold.y)) && attempts++ < 1000) {
      wumpus = { x: Math.floor(Math.random() * (width - 1)), y: Math.floor(Math.random() * (height - 1)) };
    }

    if (attempts >= 1000) {
      const msg = `Failed to generate wumpus location, due to grid size ${width},${height}`;
      console.error(msg);
      throw new Error(msg)
    }

    for (let y = 0; y < height; y++) {
      const cols = [];

      for (let x = 0; x < width; x++) {
        if (x === wumpus.x && y === wumpus.y) {
          cols[x] = [WumpusController.constants.wumpus];
        }
        else if (x === gold.x && y === gold.y) {
          cols[x] = [WumpusController.constants.gold];
        }
        else if (x !== 0 && y !== height - 1) {
          const isPit = Math.random() <= 0.2;
          cols[x] = [isPit ? WumpusController.constants.pit : WumpusController.constants.clear];
          isPit && pits.push({ x, y });
        }
        else {
          cols[x] = [WumpusController.constants.clear];
        }
      }

      rows[y] = cols;
    }
    
    const row = [];
    row[0] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
    row[1] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[2]];
    row[2] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[1]];
    row[3] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
    row[4] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[1]];
    row[5] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
    row[6] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[2]];
    row[7] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
    row[8] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[3]];
    row[9] = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];

    const pits1 = [];
    pits1.push( { x:4, y:9} );
    pits1.push({x:2,y:9});

    const wumpus1 = {x:5,y:9};
    const gold1 = {x:1,y:9};

    // pits1.forEach(pit => {
    //   WumpusController.addHint(pit, WumpusController.constants.breeze, row, width, height);
    // });
    // WumpusController.addHint(wumpus1, WumpusController.constants.stench, row, width, height);
    // WumpusController.addHint(gold1, WumpusController.constants.glitter, row, width, height);
    // console.log(row);
    // return { map: row, gold, wumpus };

    pits.forEach(pit => {
      WumpusController.addHint(pit, WumpusController.constants.breeze, rows, width, height);
    });
    WumpusController.addHint(wumpus, WumpusController.constants.stench, rows, width, height);
    WumpusController.addHint(gold, WumpusController.constants.glitter, rows, width, height);

    console.log(rows);
    
    return { map: rows, gold, wumpus };
  },

  addHint: (entity, hint, rows, width, height) => {
    if (entity.x - 1 >= 0) {
      rows[entity.y][entity.x - 1].push(hint);
    }
    if (entity.x + 1 < width) {
      rows[entity.y][entity.x + 1].push(hint);
    }
    if (entity.y - 1 >= 0) {
      rows[entity.y - 1][entity.x].push(hint);
    }
    if (entity.y + 1 < height) {
      rows[entity.y + 1][entity.x].push(hint);
    }

    return rows;
  },

  icon(goal) {
    let icon = null;

    switch (goal) {
      case WumpusController.constants.pit:
        icon = 'fas fa-skull-crossbones';
        break;
      case WumpusController.constants.pittile:
        icon = 'fas fa-square';
        break;
      case WumpusController.constants.wumpus:
        icon = 'fab fa-optin-monster';
        break;
      case WumpusController.constants.gold:
        icon = 'fa fa-gem';
        break;
      case WumpusController.constants.question:
        icon = 'fas fa-question-circle';
        break;
      case WumpusController.constants.crossbones:
        icon = 'fas fa-skull-crossbones';
        break;
      case WumpusController.constants.breeze:
        icon = 'fas fa-water';
        break;
      default:
        break;
    }

    return icon;
  },

  percept(type) {
    let indicator = null;

    switch (type) {
      case WumpusController.constants.breeze:
        indicator = { icon: WumpusController.icon(WumpusController.constants.breeze), color: 'blue' };
        break;
      case WumpusController.constants.stench:
        indicator = { icon: WumpusController.icon(WumpusController.constants.crossbones), color: 'darkred' };
        break;
      case WumpusController.constants.glitter:
        indicator = { icon: WumpusController.icon(WumpusController.constants.gold), color: 'gold' };
        break;
      default:
        break;
    }

    return indicator;
  }
};
