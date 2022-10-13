class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getState(this.props);

    this.grid = React.createRef();
    this.reset = this.reset.bind(this);
    this.print = this.print.bind(this);
    this.onGrid = this.onGrid.bind(this);
    this.updateAI = this.updateAI.bind(this);
  }

  getState(props) {
    const width = props.width;
    const height = props.height;
    AiController.initialize(0, props.height - 1, width, height);
    this.props.updateKnowledge();

    return {
      width,
      height,
      x: 0,
      y: props.height - 1,
      moves: 0,
      score: 0,
      gameOver: false,
      message: null,
      dungeon: WumpusController.generate(props.width, props.height),
    }
  }

  componentDidMount() {
    this.updateAI();
  }

  componentDidUpdate(nextProps) {
    const { width, height, reset, cheatMode } = this.props;
    if ((width && nextProps.width !== width) ||
      (height && nextProps.height !== height) ||
      (reset && nextProps.reset !== reset)) {
      this.reset();
    }
  }

  reset() {
    this.setState(this.getState(this.props), () => {
      setTimeout(() => { this.updateAI(); }, 0);
    });
  }

  update(room) {
    let gameOk = true;

    if (room) {
      let score = this.state.score;
      if (room.includes(WumpusController.constants.breeze)) {
        console.log('You feel a breeze.');
      }
      if (room.includes(WumpusController.constants.stench)) {
        console.log('You smell a stench.');
      }
      if (room.includes(WumpusController.constants.glitter)) {
        console.log('You see a glitter.');
      }
      if (room.includes(WumpusController.constants.gold)) {
        score += 100;

        console.log(`You found the treasure in ${this.state.moves} moves! Score: ${score}`);
        this.print('You win!', `You found the treasure in ${this.state.moves} moves! Score: ${score}`, 'gold', WumpusController.constants.gold, 0, 'alert-warning');

        gameOk = false;
      }
      else if (room.includes(WumpusController.constants.wumpus)) {
        console.log('You are eaten by the Wumpus! You lose!');
        this.print('You lose!', 'You were eaten by the Wumpus!', 'red', WumpusController.constants.wumpus, -5, 'alert-danger');

        score -= 1000;

        gameOk = false;
      }
      else if (room.includes(WumpusController.constants.pit)) {
        console.log('You fall in a pit! You lose!');
        this.print('You lose!', 'You fall into a deep dark pit.', 'black', WumpusController.constants.crossbones, -2, 'alert-danger');

        score -= 1000;

        gameOk = false;
      }

      score && this.setState({ score });
    }
    this.updateAI(!gameOk);
    return gameOk;
  }

  onGrid(x, y) {
    if (this.state.gameOver) {
      this.reset();
    }

    if (!this.state.gameOver) {
      const dungeon = this.state.dungeon;
      let playerLocation = { x: this.state.x, y: this.state.y };
      let message = null;
      let score = this.state.score;
      let moves = this.state.moves;

      if (this.state.gameOver) {
        this.reset();
      }

      else {
        let isMove = true;
        if (isMove && GameController.isValidMove(x, y, this.state.x, this.state.y, this.grid.current.props.width, this.grid.current.props.height)) {
          playerLocation = { x, y };

          if (this.state.x !== x || this.state.y !== y) {
            // Subtract one point from the score for each move.
            moves++;
            score--;
          }
        }
        this.setState({ dungeon, message, moves, score, x: playerLocation.x, y: playerLocation.y }, () => {
          if (!this.update(this.state.dungeon.map[playerLocation.y][playerLocation.x])) {
            this.setState({ gameOver: true });
          }
        });
      }
    }
    else {
      console.log('Tilt!');
    }
  }

  updateAI(isGameOver) {
    this.state.bestMove && this.grid.current.setValue(this.state.bestMove.x, this.state.bestMove.y, null);

    if (!isGameOver) {
      const bestMove = AiController.update(this.state.x, this.state.y, this.state.dungeon.map[this.state.y][this.state.x]);

      this.oldPath && this.oldPath.forEach(room => {
        this.grid.current.setValue(room.x, room.y, '');
      });
      this.oldPath = AiController.path;
      
      this.grid.current.setValue(bestMove.x, bestMove.y, 'lavender');

      this.props.updateKnowledge(this.state.x, this.state.y, AiController.knowledge);
      setTimeout(() => { this.onGrid(bestMove.x, bestMove.y); }, 100);

    }
  }

  print(title, text, color = 'black', icon = WumpusController.constants.clear, offset = 0, className = null) {
    const message = title ?
      <div class={`mt-1 pl-2 alert ${className} show`} role="alert" style={{ width: '400px' }}>
        <div style={{ float: 'left' }}>
          <i class={`${WumpusController.icon(icon)} mr-2`}
            style={{ fontSize: '30px', marginTop: `${offset}px`, color }}>
          </i>
        </div>
        <div>
          <strong>{title}</strong> {text}
        </div>
      </div> : null;
    this.setState({ message });
  }

  renderEntity(x, y, className, color) {
    return (
      <Entity width="50" height="50" x={x} y={y} cellStyle={className} color={color}></Entity>
    );
  }

  renderPlayer(x, y, map) {
    const percepts = [...new Set(map[y][x].filter(p =>
      [WumpusController.constants.breeze,
      WumpusController.constants.stench,
      WumpusController.constants.glitter]
        .includes(p)
    ))];

    return (
      <Entity width="50" height="50" x={x} y={y} cellStyle={`player fas fa-male ${this.state.gameOver ? 'fade' : ''}`} color="deeppink">
        {
          !this.state.gameOver &&
          <div class="percept-container">
            {
              percepts.map(percept => {
                return (
                  this.renderEntity(x, y,
                    `small percept ${WumpusController.percept(percept).icon}`,
                    WumpusController.percept(percept).color)
                )
              }
              )
            }
          </div>
        }
      </Entity>
    );
  }

  renderObjects(map) {
    const objects = [];
    const height = map.length;
    const width = map[0].length;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        map[y][x].forEach(entity => {
          if (entity === WumpusController.constants.pit) {
            objects.push(this.renderEntity(x, y, `anchor ${WumpusController.icon(WumpusController.constants.pittile)} ${this.props.cheatMode ? '' : 'd-none'}`, 'black'));
          }
          else if (entity === WumpusController.constants.wumpus) {
            objects.push(this.renderEntity(x, y, `anchor ${WumpusController.icon(WumpusController.constants.wumpus)} ${this.props.cheatMode ? '' : 'd-none'}`, 'red'));
          }
          else if (entity === WumpusController.constants.gold) {
            objects.push(this.renderEntity(x, y, `anchor ${WumpusController.icon(WumpusController.constants.gold)} ${this.props.cheatMode ? '' : 'd-none'}`, 'gold'));
          }
        });
      }
    }
    return objects;
  }

  render() {
    const entities = [this.renderPlayer(this.state.x, this.state.y, this.state.dungeon.map)].concat(
      this.renderObjects(this.state.dungeon.map)
    );

    return (
      <div id='app' ref={this.container}>
        <Grid width={this.state.width} height={this.state.height}
          grid={this.props.grid} cellStyle={this.props.cellStyle}
          onClick={this.onGrid} ref={this.grid}
        >
          {entities}
        </Grid>
        {this.state.message}
      </div>
    );
  }
}