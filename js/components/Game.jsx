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

    this.props.updateArrows();

    AiManager.initialize(0, props.height - 1, width, height);

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
      arrow: null,
      dungeon: WumpusManager.generate(props.width, props.height),
    }
  }

  componentDidMount() {
    this.updateAI();
  }

  componentDidUpdate(nextProps) {
    const { width, height, arrowState, reset, cheatMode } = this.props;

    if ((width && nextProps.width !== width) ||
      (height && nextProps.height !== height) ||
      (reset && nextProps.reset !== reset)) {
      this.reset();
    }

    if (nextProps.arrowState !== arrowState) {
      this.update();
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
      if (room.includes(WumpusManager.constants.breeze)) {
        console.log('You feel a breeze.');
      }
      if (room.includes(WumpusManager.constants.stench)) {
        console.log('You smell a stench.');
      }
      if (room.includes(WumpusManager.constants.glitter)) {
        console.log('You see a glitter.');
      }
      if (room.includes(WumpusManager.constants.gold)) {
        score += 100;

        console.log(`You found the treasure in ${this.state.moves} moves! Score: ${score}`);
        this.print('You win!', `You found the treasure in ${this.state.moves} moves! Score: ${score}`, 'gold', WumpusManager.constants.gold, 0, 'alert-warning');

        gameOk = false;
      }
      else if (room.includes(WumpusManager.constants.wumpus)) {
        console.log('You are eaten by the Wumpus! You lose!');
        this.print('You lose!', 'You were eaten by the Wumpus!', 'red', WumpusManager.constants.wumpus, -5, 'alert-danger');

        score -= 1000;

        gameOk = false;
      }
      else if (room.includes(WumpusManager.constants.pit)) {
        console.log('You fall in a pit! You lose!');
        this.print('You lose!', 'You fall into a deep dark pit.', 'black', WumpusManager.constants.crossbones, -2, 'alert-danger');

        score -= 1000;

        gameOk = false;
      }

      score && this.setState({ score });
    }
    this.updateAI(!gameOk);
    return gameOk;
  }

  onGrid(x, y) {
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
        if (isMove && GameManager.isValidMove(x, y, this.state.x, this.state.y, this.grid.current.props.width, this.grid.current.props.height)) {
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
            setTimeout(() => {
              // Game over.
              this.reset();
            }, 3000);
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
      const bestMove = AiManager.update(this.state.x, this.state.y, this.state.dungeon.map[this.state.y][this.state.x]);

      this.oldPath && this.oldPath.forEach(room => {
        this.grid.current.setValue(room.x, room.y, '');
      });
      this.oldPath = AiManager.path;
      // AiManager.path.forEach(room => {
      //   this.grid.current.setValue(room.x, room.y, '#f0ffff');
      // });

      this.grid.current.setValue(bestMove.x, bestMove.y, 'lavender');
      this.setState({ bestMove });

      this.props.updateKnowledge(this.state.x, this.state.y, AiManager.knowledge);
    }
  }

  print(title, text, color = 'black', icon = WumpusManager.constants.clear, offset = 0, className = null) {
    const message = title ?
      <div class={`mt-1 pl-2 alert ${className} show`} role="alert" style={{ width: '400px' }}>
        <div style={{ float: 'left' }}>
          <i class={`${WumpusManager.icon(icon)} mr-2`}
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
      [WumpusManager.constants.breeze,
      WumpusManager.constants.stench,
      WumpusManager.constants.glitter]
        .includes(p)
    ))];

    return (
      <Entity width="50" height="50" x={x} y={y} cellStyle={`player fas fa-female ${this.state.gameOver ? 'fade' : ''}`} color="deeppink">
        {
          !this.state.gameOver &&
          <div class="percept-container">
            {
              percepts.map(percept => {
                return (
                  this.renderEntity(x, y,
                    `small percept ${WumpusManager.percept(percept).icon}`,
                    WumpusManager.percept(percept).color)
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
          if (entity === WumpusManager.constants.pit) {
            objects.push(this.renderEntity(x, y, `anchor ${WumpusManager.icon(WumpusManager.constants.pittile)} ${this.props.cheatMode ? '' : 'd-none'}`, 'black'));
          }
          else if (entity === WumpusManager.constants.wumpus) {
            objects.push(this.renderEntity(x, y, `anchor ${WumpusManager.icon(WumpusManager.constants.wumpus)} ${this.props.cheatMode ? '' : 'd-none'}`, 'red'));
          }
          else if (entity === WumpusManager.constants.gold) {
            objects.push(this.renderEntity(x, y, `anchor ${WumpusManager.icon(WumpusManager.constants.gold)} ${this.props.cheatMode ? '' : 'd-none'}`, 'gold'));
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