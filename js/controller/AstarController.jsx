const AstarController = {
    init: function(grid) {
        for(var y = 0, yl = grid.length; y < yl; y++) {
            for(var x = 0, xl = grid[y].length; x < xl; x++) {
                var node = grid[y][x];
                node.f = 0;
                node.g = 0;
                node.h = 0;
                node.cost = 1;
                node.astarvisited = false;
                node.closed = false;
                node.parent = null;
            }
        }
    },

    heap: function() {
        return new BinaryHeap(function(node) {
            return node.f;
        });
    },

    search: function(grid, start, end, isBlockFunc, diagonal, heuristic) {
        AstarController.init(grid);
        heuristic = heuristic || AstarController.manhattan;
        diagonal = !!diagonal;

        var openHeap = AstarController.heap();

        openHeap.push(start);

        while(openHeap.size() > 0) {
            var currentNode = openHeap.pop();
            if(currentNode === end) {
                var curr = currentNode;
                var ret = [];
                while(curr.parent) {
                    ret.push(curr);
                    curr = curr.parent;
                }
                return ret.reverse();
            }
            currentNode.closed = true;
            var neighbors = AstarController.neighbors(grid, currentNode, diagonal);

            for(var i=0, il = neighbors.length; i < il; i++) {
                var neighbor = neighbors[i];

                if(neighbor.closed || (isBlockFunc && isBlockFunc(neighbor))) {
                    continue;
                }
                var gScore = currentNode.g + neighbor.cost;
                var beenastarVisited = neighbor.astarvisited;

                if(!beenastarVisited || gScore < neighbor.g) {
                    neighbor.astarvisited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic({x:neighbor.x, y:neighbor.y}, {x:end.x,y:end.y});
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!beenastarVisited) {
                        openHeap.push(neighbor);
                    }
                    else {
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }
        return [];
    },

    manhattan: function(pos0, pos1) {
        var d1 = Math.abs (pos1.x - pos0.x);
        var d2 = Math.abs (pos1.y - pos0.y);
        return d1 + d2;
    },

    neighbors: function(grid, node, diagonals) {
        var ret = [];
        var x = node.x;
        var y = node.y;
        if(grid[y] && grid[y][x-1]) {
            ret.push(grid[y][x-1]);
        }
        if(grid[y] && grid[y][x+1] && grid[y][x+1]) {
            ret.push(grid[y][x+1]);
        }
        if(grid[y+1] && grid[y+1][x]) {
            ret.push(grid[y+1][x]);
        }
        if(grid[y-1] && grid[y-1][x]) {
            ret.push(grid[y-1][x]);
        }

        if (diagonals) {
            if(grid[y+1] && grid[y+1][x-1]) {
                ret.push(grid[y+1][x-1]);
            }
            if(grid[y+1] && grid[y+1][x+1]) {
                ret.push(grid[y+1][x+1]);
            }
            if(grid[y-1] && grid[y-1][x-1]) {
                ret.push(grid[y-1][x-1]);
            }
            if(grid[y-1] && grid[y-1][x+1]) {
                ret.push(grid[y-1][x+1]);
            }
        }

        return ret;
    }
};

class BinaryHeap {
  constructor(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  push(element) {
    this.content.push(element);
    this.sinkDown(this.content.length - 1);
  }

  pop() {
    var result = this.content[0];
    var end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  }

  remove(node) {
    var i = this.content.indexOf(node);
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  }

  size() {
    return this.content.length;
  }

  rescoreElement(node) {
    this.sinkDown(this.content.indexOf(node));
  }

  sinkDown(n) {
    var element = this.content[n];
    while (n > 0) {

      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      }
      else {
        break;
      }
    }
  }

  bubbleUp(n) {
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      var swap = null;
      var child1Score;
      if (child1N < length) {
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      else {
        break;
      }
    }
  }
}
