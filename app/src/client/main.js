import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AreaChart from './chart'

class Chart extends Component {
	render() {
		return (
			<AreaChart eData={this.props.eData}/>
		);
	}
};

class App extends Component {
	constructor(props) {
		super(props)
		this.state = {
      emotionData: [],
		}
		this.handleEmotionData = this.handleEmotionData.bind(this)
	}
	handleEmotionData(data) {
		// console.log(data)
		this.setState({emotionData: [...this.state.emotionData, data]})
	}
	render() {
		return (
			<div>
        {this.state.message}
			</div>
		);
	}
};

ReactDOM.render(
	<App />,
	document.getElementById('entry')
);
