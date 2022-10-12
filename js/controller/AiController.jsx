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
    // Adds perceptions about this room to the knowledge base.
    if (room) {
      // Check percepts.
      if (room.includes(WumpusController.constants.breeze)) {
        AiController.knowledge[y][x].breeze = true;
      }

      if (room.includes(WumpusController.constants.stench)) {
        AiController.knowledge[y][x].stench = true;
      }

      if (room.includes(WumpusController.constants.glitter)) {
        AiController.knowledge[y][x].glitter = true;
      }

      // Deduce knowledge about adjacent rooms.
      AiController.deduce(x, y);

      // Set this room as visited and safe.
      AiController.knowledge[y][x].visited = AiController.knowledge[y][x].visited ? AiController.knowledge[y][x].visited + 1 : 1;
      AiController.knowledge[y][x].pit = 0;
      AiController.knowledge[y][x].wumpus = 0;
      AiController.knowledge[y][x].gold = 0;

      // Choose the next move.
      AiController.recommendedMove = AiController.move(x, y);

      /*if (AiController.recommendedMove.knowledge.visited > 1) {
        !AiController.foundLoop && console.log('Risky business!');
        AiController.foundLoop = true;
      }
      else if (!AiController.recommendedMove.knowledge.visited) {
        AiController.foundLoop && console.log('Playing it safe.');
        AiController.foundLoop = false;
      }*/

      return AiController.recommendedMove;
    }
  },

  deduce: (x, y) => {
    // Updates adjacent rooms with knowledge.
    const knowledge = AiController.knowledge[y][x];
    AiController.think(x, y - 1, knowledge);
    AiController.think(x + 1, y, knowledge);
    AiController.think(x, y + 1, knowledge);
    AiController.think(x - 1, y, knowledge);
  },

  think: (x, y, knowledge) => {
    // x,y = adjacent room to think about.
    // knowledge = perceptions from the current room
    let adjRoom;

    // If this is the first time we've entered this room, update knowledge for adjacent rooms.
    if (x >= 0 && x < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length && !knowledge.visited) {
      adjRoom = AiController.knowledge[y][x];

      if (knowledge.breeze && !adjRoom.visited) {
        adjRoom.pit += 0.25;
      }

      if (!knowledge.breeze) {
        // If the room has no breeze, update all adjacent rooms to set pit to 0.
        AiController.knowledge[y][x].pit = 0;
      }

      if (knowledge.stench) {
        if (!adjRoom.visited && !AiController.foundWumpus) {
          adjRoom.wumpus += 0.25;
          if (adjRoom.wumpus >= 0.5) {
            AiController.foundWumpus = true;

            // We found the wumpus room. Find all adjacent rooms and update their adjacent rooms to no wumpus (except for adjRoom, which of course, has the wumpus).
            const adjRooms = AiController.availableRooms(adjRoom.x, adjRoom.y);
            // Go through each adjacent room of the wumpus, where we would perceive a stench.
            adjRooms.forEach(room => {
              // Find all adjacent rooms to the stench and set wumpus to 0, except for adjRoom, which is the actual wumpus.
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
        // No stench in the originating room, so all adjacent rooms will not be the wumpus.
        AiController.knowledge[adjRoom.y][adjRoom.x].wumpus = 0;
      }

      if (knowledge.glitter && !adjRoom.visited) {
        adjRoom.gold += 0.25;

        // Did we find the gold?
        AiController.foundGold = AiController.foundGold || (adjRoom.gold >= 0.5 ? {x, y} : false);
        if (AiController.foundGold) {
          // Since there is only 1 gold, we can now eliminate all other gold probabilities.
          for (let ry=0; ry<AiController.knowledge.length; ry++) {
            for (let rx=0; rx<AiController.knowledge[ry].length; rx++) {
              // Set all other gold probabilities to 0.
              AiController.knowledge[ry][rx].gold = AiController.knowledge[ry][rx].gold >= 0.5 ? AiController.knowledge[ry][rx].gold : 0;
            }
          };
        }
      }
    }

    return adjRoom;
  },

  move: (x, y) => {
    // Determines the next best move from starting point x, y.
    /*
    Rules:
    R = Room, P = Pit, W = Wumpus, T = Treasure
    B = Breeze, S = Stench, G = Glitter, O = OK

    Adj(R)^B(R) => P(R)
    Adj(R)^S(R) => W(R)
    Adj(R)^G(R) => T(R)
    !P(R)^!W(R) => O(R)

    Example: Is R(2,1) safe?

    Satisfy: O(R21) = True

    !P(R)^!W(R) => O(R21)
    !(Adj(R)^B(R)) ^ !(Adj(R)^S(R)) => O(R21)

    ^^ This will check all adjacent rooms for breeze or stench. If none, the room is OK.
    Additionally, when a loop is detected in AI hints, we relax the logical constraints to take more risky moves.
    */
    let room;

    const rooms = AiController.availableRooms(x, y);

    // Does a room contain a probability of gold > 0? Select the highest probability room.
    //room = rooms.filter(room => room.knowledge.gold && room.knowledge.gold === Math.max(...rooms.map(room => room.knowledge.gold)) && (room.knowledge.gold >= 0.5 || (!AiController.foundLoop ? (!room.knowledge.pit && !room.knowledge.wumpus) : (room.knowledge.pit < 0.5 && room.knowledge.wumpus < 0.5))))[0];
    room = rooms.filter(room => room.knowledge.gold && room.knowledge.gold === Math.max(...rooms.map(room => room.knowledge.gold)) && (room.knowledge.gold >= 0.5 || (!room.knowledge.pit && !room.knowledge.wumpus)))[0];

    // Does a room contain a glitter?
    if (!room) {
      room = rooms.find(room => room.knowledge.glitter && !room.knowledge.pit && !room.knowledge.wumpus);
    }

    // All adjacent rooms are either visited or contain a possible enemy. Is there another unvisited room that is safe?
    if (!room || AiController.foundGold) {
      const closestSafeRooms = [];

      if (AiController.foundGold) {
        closestSafeRooms.push(AiController.knowledge[AiController.foundGold.y][AiController.foundGold.x]);
      }
      else {
        for (let ry=0; ry<AiController.knowledge.length; ry++) {
          // Find all least visited safe rooms in this row.
          //const potentialSafeRooms = AiController.knowledge[ry].filter(knowledge => (knowledge.x !== x || knowledge.y !== y) && (!AiController.foundLoop ? (!knowledge.pit && !knowledge.wumpus) : (knowledge.pit < 0.5 && knowledge.wumpus < 0.5)));
          const potentialSafeRooms = AiController.knowledge[ry].filter(knowledge => (knowledge.x !== x || knowledge.y !== y) && !knowledge.visited && !knowledge.pit && !knowledge.wumpus);
          closestSafeRooms.push.apply(closestSafeRooms, potentialSafeRooms);
        }
      }

      // Sort by least visited, then by distance.
      closestSafeRooms.sort((a, b) => {
        // If the number of visits are equal sort by distance instead.
        return (b.visited - a.visited) || (AstarController.manhattan({ x, y }, { x: b.x, y: b.y }) - AstarController.manhattan({ x, y }, { x: a.x, y: a.y }));
      });

      const originalSafeRooms = Object.assign([], closestSafeRooms);

      // Finally, move in the safest direction of the room found.
      let target = {};
      while (target) {
        target = closestSafeRooms.pop();
        if (target) {
          // Find a safe path from the current position to the target room, avoid all potential wumpus or pits.
          AiController.path = AstarController.search(AiController.knowledge, AiController.knowledge[y][x], target, room => { return room.pit || room.wumpus });
          if (AiController.path.length) {
            const next = AiController.path[0];
            room = { x: next.x, y: next.y, knowledge: AiController.knowledge[next.y][next.x] };
            break;
          }
        }
      }

      if (!room) {
        // No safe path available, relax the constraints.
        console.log('Risky business!');
        target = {};
        while (target) {
          target = originalSafeRooms.pop();
          if (target) {
            // Find a safe path from the current position to the target room, avoid all certain wumpus or pits.
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

    // If all else fails, backtrack to a previously visited room.
    if (!room) {
      room = rooms.sort((a, b) => { return a.knowledge.visited - b.knowledge.visited; })[0];
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

  isPit: (x, y) => {
    if (x >= 0 && x < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length)
      return AiController.knowledge[y][x].pit >= 0.5;
    else
      return false;
  },

  isWumpus: (x, y) => {
    if (x >= 0 && x < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length)
      return AiController.knowledge[y][x].wumpus >= 0.5;
    else
      return false;
  },

  isGold: (x, y) => {
    if (x >= 0 && x < AiController.knowledge[0].length && y >= 0 && y < AiController.knowledge.length)
      return AiController.knowledge[y][x].gold >= 0.5;
    else
      return false;
  },

  pad: (pad, str, padLeft) => {
    if (typeof str === 'undefined')
      return pad;
    if (padLeft) {
      return (pad + str).slice(-pad.length);
    } else {
      return (str + pad).substring(0, pad.length);
    }
  },

  toString: (playerX, playerY) => {
    let result = '';

    for (let y=0; y < AiController.knowledge.length; y++) {
      result += '|';

      for (let x=0; x < AiController.knowledge[y].length; x++) {
        result += `${AiController.knowledge[y][x].wumpus >= 0.5? '^^^' : ''}${AiController.knowledge[y][x].wumpus === 0.25? '^' : ''}${AiController.knowledge[y][x].pit >= 0.5 ? '@@@' : ''}${AiController.knowledge[y][x].pit === 0.25 ? '@' : ''}${(x === AiController.recommendedMove.x && y === AiController.recommendedMove.y) ? '$' : ''}${(x === playerX && y === playerY) ? '*' : ''} v:${AiController.pad('    ', AiController.knowledge[y][x].visited)} p:${AiController.pad('    ', AiController.knowledge[y][x].pit)} w:${AiController.pad('    ', AiController.knowledge[y][x].wumpus)} g:${AiController.pad('    ', AiController.knowledge[y][x].gold)}${x === AiController.recommendedMove.x && y === AiController.recommendedMove.y ? '$$' : ''}${x === playerX && y === playerY ? '**' : ''}${AiController.knowledge[y][x].pit >= 0.5 ? '@@@@' : ''}${AiController.knowledge[y][x].pit === 0.25 ? '@@' : ''}${AiController.knowledge[y][x].wumpus >= 0.5 ? '^^^^' : ''}${AiController.knowledge[y][x].wumpus === 0.25 ? '^^' : ''}|`;
      }
      result += '\n';
    }

    return result;
  }
};
