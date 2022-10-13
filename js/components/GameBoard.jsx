class GameBoard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: props.width || 10,
      height: props.height || 10,
      reset: 0,
      cheat: true,
    };

    this.game = React.createRef();
    this.onReset = this.onReset.bind(this);
    this.onCheat = this.onCheat.bind(this);
    this.onKnowledge = this.onKnowledge.bind(this);
  }

  onReset() {
    this.setState({ reset: this.state.reset + 1 });
  }

  onCheat() {
    this.setState({ cheat: !this.state.cheat });
  }

  onKnowledge(x, y, knowledge) {
    this.setState({ x, y, knowledge });
  }

  render() {
    return (
      <div>
        <Game width={this.state.width} height={this.state.height}
          cheatMode={this.state.cheat} reset={this.state.reset}
          updateKnowledge={this.onKnowledge} />

        <button type="button" class="btn btn-secondary btn-sm" data-toggle="button" aria-pressed="false" autocomplete="off" onClick={this.onCheat}>
          Cheat
        </button>
        <div id='knowledgebase' class='row no-guggers'>
          <div class='col-auto'>
            AI Knowledge
            <div id='knowledgebaseContainer'>
              <Knowledge value={this.state.knowledge} x={this.state.x} y={this.state.y} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}