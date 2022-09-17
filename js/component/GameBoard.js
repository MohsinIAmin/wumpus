class GameBoard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            width: props.width || 10,
            height: props.height || 10
        }
    }

    render() {
        return (
             <div>
                <Game />
             </div>
        );
    }
}