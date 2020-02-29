import React, { Component } from 'react';
import axios from 'axios';
import L from 'leaflet';
import Noty from 'noty';
import '../../node_modules/noty/lib/noty.css';
import '../../node_modules/noty/lib/themes/sunset.css';
import { css } from '@emotion/core';
import { PropagateLoader } from 'react-spinners';
import config from '../config';
import MapComp from './tracking/MapComp';
import SatDataComp from './tracking/SatDataComp';
import SatDescripComp from './tracking/SatDescripComp';
import geoData from './tracking/geoData';
import sat from '../satellites';
import 'leaflet/dist/leaflet.css';
import './tracking/trackerSat.css';
import Title from './title';

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

// Initializing library TLE.js
const TLEJS = require('tle.js');

// Instanciate a new TLEJS
const tlejs = new TLEJS();

// TrackSat component
class TrackSat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hits: null,
      jsonSatList: sat,
      zoom: 3,
      isLoading: true,
      error: null,
      satNameVal: sat[0].name,
      satId: [25544],
      satDescrip: [sat[0].description],
      satLaunchDate: [sat[0].launch],
      mapCenter: [43.604, 1.444],
      tle:
        '1 25544U 98067A   19120.40833581  .00001450  00000-0  30616-4 0  9995\r\n2 25544  51.6410 238.6747 0000873 256.1238 216.5201 15.52607716167833',
      coords: { lat: '', lng: '' },
    };
    // Binding methods
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getSatCoords = this.getSatCoords.bind(this);
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.getTLE();
    // this.getCurrentCoords();
    // this.getCurrentOrbitCoords();
    this.updatingSatCoords();
    this.buildGeoJson();
  }

  // Stopping the time interval
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  // Getting TLE data from the API with axios
  getTLE() {
    const { satId } = this.state;
    const url = `${config.N2YO_TLE_URL}${satId}&apiKey=${process.env
      .REACT_APP_API_KEY || process.env.GATSBY_API_KEY}`;
    axios
      .get(url)
      .then((resp) =>
        this.setState(
          {
            hits: resp.data,
            tle: resp.data.tle,
            isLoading: false,
          },
          this.getCurrentCoords,
        ),
      )
      .catch((error) => this.setState({ error, isLoading: false }));
  }

  // Getting satellite latitude & longitude from TLE.js
  getSatCoords() {
    const { tle } = this.state;
    const tleStr = tle;
    const timestampMS = Date.now();
    const latLonObj = tlejs.getLatLon(tleStr, timestampMS);
    this.setState({ coords: latLonObj });
    return latLonObj;
  }

  // Switching satellite icon on select input validation
  getMarkerChange() {
    const { satId } = this.state;
    const issMarker = L.icon({
      // eslint-disable-next-line global-require
      iconUrl: require('./images/iss.png'),
      iconSize: [80, 80],
    });
    const satMarker = L.icon({
      // eslint-disable-next-line global-require
      iconUrl: require('./images/satellite.png'),
      iconSize: [60, 60],
    });
    const marker = satId[0] === 25544 ? issMarker : satMarker;
    return marker;
  }

  // Getting orbit coordinates
  getCurrentOrbitCoords() {
    const { tle } = this.state;
    const threeOrbitsArr = tlejs.getGroundTrackLngLat(tle);
    const currentOrbitArr = threeOrbitsArr[1];
    // this.setState({ currentOrbitCoords: currentOrbitArr });
    return currentOrbitArr;
  }

  // Calling two methods
  getMethods() {
    const latLonObj = this.getSatCoords();
    this.updateMapCenter(latLonObj);
  }

  // Updating sat coords
  updatingSatCoords() {
    this.interval = setInterval(this.getSatCoords, 1000);
  }

  // Building a geoJSON like object (identical object structure)
  buildGeoJson() {
    // const { tle } = this.state;
    // const threeOrbitsArr = tlejs.getGroundTrackLngLat(tle);
    // const currentOrbitArr = threeOrbitsArr[1];
    // const { currentOrbitCoords } = this.state;
    const geometry = {
      ...geoData.features[0].geometry,
      type: 'LineString',
      coordinates: this.getCurrentOrbitCoords(),
    };
    const typePropsGeometry = [{ ...geoData.features[0], geometry: geometry }];
    const features = { ...geoData, features: typePropsGeometry };
    return features;
  }

  updateMapCenter(coords) {
    // const { coords } = this.state;
    // this.setState({ currentOrbitCoords: null });
    // clearInterval(this.interval);
    this.getTLE();
    // this.getCurrentCoords();
    // this.getCurrentOrbitCoords();
    // this.buildGeoJson();
    setTimeout(
      () => this.setState({ mapCenter: [coords.lat, coords.lng] }),
      800,
    );
  }

  // Handling change of select input form
  handleChange(event) {
    this.setState({ satNameVal: event.target.value });
  }

  // Submitting the form input change
  handleSubmit(event) {
    const { satNameVal, jsonSatList } = this.state;
    event.preventDefault();
    // text: `You choose to track : ${value}`,
    new Noty({
      theme: 'sunset',
      type: 'info',
      text: `You're tracking ${satNameVal}`,
      timeout: 2000,
    }).show();
    // Extracting the satellite id from the name value store in the state
    const idMatched = jsonSatList
      .filter((item) => item.name === satNameVal)
      .map((singleItem) => singleItem.id);
    // Extracting the satellite description from the name value store in the state
    const descriptionMatched = jsonSatList
      .filter((item) => item.name === satNameVal)
      .map((singleItem) => singleItem.description);
    // Extracting the satellite launch date from the name value store in the state
    const dateMatched = jsonSatList
      .filter((item) => item.name === satNameVal)
      .map((singleItem) => singleItem.launch);

    // Updating State with satellite id, description and launch date
    this.setState(
      {
        satId: idMatched,
        satDescrip: descriptionMatched,
        satLaunchDate: dateMatched,
      },
      this.getMethods,
    );
  }

  render() {
    // Destructuring & variable assignation
    const {
      hits,
      jsonSatList,
      isLoading,
      error,
      zoom,
      satNameVal,
      satId,
      satDescrip,
      satLaunchDate,
      mapCenter,
      coords,
    } = this.state;
    const uniqueKey = Date.now();

    // Console logging of the number of transcations with the API
    if (hits) {
      console.log(
        `Count of transactions performed in last 60 min : ${hits.info.transactionscount}`,
      );
    }

    // Displaying error message if any
    if (error) {
      return <p>{error.message}</p>;
    }
    // Displaying loading
    if (isLoading) {
      return (
        <div className="container minPageSizeBlue">
          <div className="row">
            <div className="text-center mx-auto m-5">
              <PropagateLoader
                css={override}
                sizeUnit="px"
                size={25}
                color="#43a2d0"
                loading={this.loading}
              />
            </div>
          </div>
        </div>
      );
    }

    // Making the option tag list for form select input
    const satList = jsonSatList.map((item) => (
      <option key={item.id} value={item.name}>
        {item.name}
      </option>
    ));

    return (
      <div className="container-fluid text-center tracker-page">
        <Title
          title="Space &amp; Earth science satellites tracking"
          idStyle="titlelight"
        />
        <div className="containerStyle">
          <div className="mapLoc">
            <MapComp
              position={coords}
              mapCenter={coords}
              zoom={zoom}
              marker={this.getMarkerChange()}
              geoJsonData={this.buildGeoJson()}
              keyGeoJson={uniqueKey}
              satName={satNameVal}
            />
            <SatDataComp
              launchDate={satLaunchDate}
              position={coords}
              hits={hits}
            />
          </div>
          <SatDescripComp
            submitSatSelect={this.handleSubmit}
            satName={satNameVal}
            onChange={this.handleChange}
            hits={hits}
            satList={satList}
            satDescrip={satDescrip}
          />
        </div>
      </div>
    );
  }
}

export default TrackSat;
