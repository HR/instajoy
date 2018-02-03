import React from 'react';
import {AreaChart} from 'react-easy-chart';

function AChart(props) {
  let dataObject = props.eData.map((el,i) => {
    // let t = new Date(el.timestamp).toUTC()
    return {x: i, y: el.emotion}
  })
  console.log(dataObject)
  return(
    <div>
      <p>Hello:</p>
      <AreaChart
        // xType={'time'}
        width={700}
        height={250}
        interpolate={'cardinal'}
        xDomainRange={[0, 100]}
        yDomainRange={[1, 10]}
        data={[
          dataObject
        ]}
      />
    </div>
  )
}

export default AChart
