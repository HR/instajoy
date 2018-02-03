import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import VideoExample from './video';
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
      emotionData: []
		}
		this.handleEmotionData = this.handleEmotionData.bind(this)
	}
	handleEmotionData(data) {
		// console.log(data)
		this.setState({emotionData: [...this.state.emotionData, data]})
	}
	render() {
		const style = {
		  margin: 12,
		};
		return (
			<div>
				<VideoExample onDataPush={this.handleEmotionData}/>
				<Chart eData={this.state.emotionData} />
			</div>
		);
	}
};

ReactDOM.render(
	<App />,
	document.getElementById('entry')
);

// ReactDOM.render(
// 	<Chart />,
// 	document.getElementById('well')
// );
