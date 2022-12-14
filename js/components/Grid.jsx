class Grid extends React.Component {
  constructor(props) {
    super(props);

    const values = props.grid || [];
    if (!props.grid) {
      for (let y = 0; y <= props.height; y++) {
        const row = [];
        for (let x = 0; x <= props.width; x++) {
          row.push(0);
        }
        values.push(row);
      }
    }

    this.state = {
      values,
      width: props.width,
      height: props.height,
    };

    this.onClick = this.onClick.bind(this);
    this.setValue = this.setValue.bind(this);
  }

  componentDidUpdate(nextProps) {
    const { width, height } = this.props;
    if ((width && nextProps.width !== width) || (height && nextProps.height !== height)) {
      const values = [];
      for (let y = 0; y <= height; y++) {
        const row = [];
        for (let x = 0; x <= width; x++) {
          row.push(0);
        }
        values.push(row);
      }
      this.setState({ values, width, height });
    }
  }

  onClick(cell, x, y) {
    this.props.onClick(x, y, this.state.values, cell);
  }

  setValue(x, y, value) {
    const values = this.state.values;
    values[y][x] = value;
    this.setState({ values });
  }

  render() {
    const rows = [];
    for (let y = 0; y < this.state.height; y++) {
      const cols = []
      for (let x = 0; x < this.state.width; x++) {
        cols.push(
          <td>
            <Cell x={x} y={y} color={this.state.values[y][x]}
              cellStyle={this.props.cellStyle} onClick={this.onClick}
            >
              {this.props.children.map((entity, index) => {
                return (x === entity.props.x && y === entity.props.y)
                  ? this.props.children[index]
                  : null
              })}
            </Cell>
          </td>
        );
      }

      rows.push(<tr>{cols}</tr>);
    }

    return (
      <div class='grid'>
        <table>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    )
  }
}
