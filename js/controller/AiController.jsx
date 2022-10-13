const AiController = {
  knowledge: [],
  path: [],
  foundLoop: false,
  foundWumpus: false,
  foundGold: false,
  recommendedMove: {},

  initialize: (x, y, width, height) => {
    AiController.knowledge = [];
    AiController.path = [];
    AiController.foundWumpus = false;
    AiController.foundGold = false;
    AiController.foundLoop = false;
    AiController.recommendedMove = {};

    for (let y=0; y<height; y++) {
      const row = [];

      for (let x=0; x<width; x++) {
        row.push({ x, y, visited: 0, pit: 0, wumpus: 0, gold: 0 });
      }

      AiController.knowledge.push(row);
    }
  },

  update: (x, y, room) => {
    if (room) {
      if (room.includes(WumpusController.constants.breeze)) {
        AiController.knowledge[y][x].breeze = true;
      }
      if (room.includes(WumpusController.constants.stench)) {
        AiController.knowledge[y][x].stench = true;
      }
      if (room.includes(WumpusController.constants.glitter)) {
        AiController.knowledge[y][x].glitter = true;
      }
      AiController.deduce(x, y);
      AiController.knowledge[y][x].visited = AiController.knowledge[y][x].visited ? AiController.knowledge[y][x].visited + 1 : 1;
      AiController.knowledge[y][x].pit = 0;
      AiController.knowledge[y][x].wumpus = 0;
      AiController.knowledge[y][x].gold = 0;
      AiController.recommendedMove = AiController.move(x, y);

      return AiController.recommendedMove;
    }
  },

  deduce: (x, y) => {
    const knowledge = AiController.knowledge[y][x];
    AiController.think(x, y - 1, knowledge);
    AiController.think(x + 1, y, knowledge);
    AiController.think(x, y + 1, knowledge);
    AiController.think(x - 1, y, knowledge);
  },

  think: (x, y, knowledge) => {
    let adjRoom;
    if (x >= 0 && x < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length && !knowledge.visited) {
      adjRoom = AiController.knowledge[y][x];
      if (knowledge.breeze && !adjRoom.visited) {
        adjRoom.pit += 0.25;
      }
      if (!knowledge.breeze) {
        AiController.knowledge[y][x].pit = 0;
      }
      if (knowledge.stench) {
        if (!adjRoom.visited && !AiController.foundWumpus) {
          adjRoom.wumpus += 0.25;
          if (adjRoom.wumpus >= 0.5) {
            AiController.foundWumpus = true;
            const adjRooms = AiController.availableRooms(adjRoom.x, adjRoom.y);
            adjRooms.forEach(room => {
              const adjRooms2 = AiController.availableRooms(room.x, room.y);
              adjRooms2.forEach(room2 => {
                if (room2.x !== adjRoom.x && room2.y !== adjRoom.y) {
                  AiController.knowledge[room2.y][room2.x].wumpus = 0;
                }
              })
            });
          }
        }
      }
      else {
        AiController.knowledge[adjRoom.y][adjRoom.x].wumpus = 0;
      }

      if (knowledge.glitter && !adjRoom.visited) {
        adjRoom.gold += 0.25;
        AiController.foundGold = AiController.foundGold || (adjRoom.gold >= 0.5 ? {x, y} : false);
        if (AiController.foundGold) {
          for (let ry=0; ry<AiController.knowledge.length; ry++) {
            for (let rx=0; rx<AiController.knowledge[ry].length; rx++) {
              AiController.knowledge[ry][rx].gold = AiController.knowledge[ry][rx].gold >= 0.5 ? AiController.knowledge[ry][rx].gold : 0;
            }
          };
        }
      }
    }
    return adjRoom;
  },

  move: (x, y) => {
    let room;

    const rooms = AiController.availableRooms(x, y);
    room = rooms.filter(room => room.knowledge.gold && room.knowledge.gold === Math.max(...rooms.map(room => room.knowledge.gold)) && (room.knowledge.gold >= 0.5 || (!room.knowledge.pit && !room.knowledge.wumpus)))[0];

    if (!room) {
      room = rooms.find(room => room.knowledge.glitter && !room.knowledge.pit && !room.knowledge.wumpus);
    }

    if (!room || AiController.foundGold) {
      const closestSafeRooms = [];

      if (AiController.foundGold) {
        closestSafeRooms.push(AiController.knowledge[AiController.foundGold.y][AiController.foundGold.x]);
      }
      else {
        for (let ry=0; ry<AiController.knowledge.length; ry++) {
          const potentialSafeRooms = AiController.knowledge[ry].filter(knowledge => (knowledge.x !== x || knowledge.y !== y) && !knowledge.visited && !knowledge.pit && !knowledge.wumpus);
          closestSafeRooms.push.apply(closestSafeRooms, potentialSafeRooms);
        }
      }

      closestSafeRooms.sort((a, b) => {
        return (b.visited - a.visited);
      });

      const originalSafeRooms = Object.assign([], closestSafeRooms);
      let target = {};
      while (target) {
        target = closestSafeRooms.pop();
        if (target) {
          AiController.path = AstarController.search(AiController.knowledge, AiController.knowledge[y][x], target, room => { return room.pit || room.wumpus });
          if (AiController.path.length) {
            const next = AiController.path[0];
            room = { x: next.x, y: next.y, knowledge: AiController.knowledge[next.y][next.x] };
            break;
          }
        }
      }

      if (!room) {
        console.log('Risky!');
        target = {};
        while (target) {
          target = originalSafeRooms.pop();
          if (target) {
            AiController.path = AstarController.search(AiController.knowledge, AiController.knowledge[y][x], target, room => { return room.pit >= 0.5 || room.wumpus >= 0.5 });
            if (AiController.path.length) {
              const next = AiController.path[0];
              room = { x: next.x, y: next.y, knowledge: AiController.knowledge[next.y][next.x] };
              break;
            }
          }
        }
      }
    }

    if (!room) {
      room = rooms.sort((a, b) => { return b.knowledge.visited - a.knowledge.visited; })[0];
    }
    return room;
  },

  availableRooms: (x, y) => {
    const rooms = [];

    if (x >= 0 && x < AiController.knowledge[0].length && y - 1 >= 0 && y - 1 < AiController.knowledge.length)
      rooms.push({ x, y: y - 1, knowledge: AiController.knowledge[y-1][x] });
    if (x + 1 >= 0 && x + 1 < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length)
      rooms.push({ x: x + 1, y, knowledge: AiController.knowledge[y][x+1] });
    if (x >= 0 && x < AiController.knowledge[0].length && y + 1 >= 0 && y + 1 < AiController.knowledge.length)
      rooms.push({ x, y: y + 1, knowledge: AiController.knowledge[y+1][x] });
    if (x - 1 >= 0 && x - 1 < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length)
      rooms.push({ x: x - 1, y, knowledge: AiController.knowledge[y][x-1] });

    return rooms;
  },

};
