import React, { Component } from 'react';
import './App.css';
import Form from './Components/Form.js'
import Comparison from './Components/Comparison.js'
import Logo from './Components/Logo.js'
import Loader from './Components/Loader.js'
const lyftURL = 'https://api.lyft.com/'
const uberUrl = 'https://api.uber.com/'
const url = 'http://localhost:3006/'

class App extends Component {
  constructor() {
    super()
    this.state = {
      uberPrice: null,
      uberTime: null,
      puAddress: '',
      doAddress: '',
      autocompletePu: '',
      autocompleteDo: '',
      lyftCost: null,
      lyftETA: null,
      dropoffLatLong: '',
      pickupLatLong: '',
      fetchingEstimates: false,
      orderedLyft: false,
      orderedUber: false,
      uberData: [],
      lyftData: []
    }
  }

  fetchUberPrice = async (startLat, startLong, endLat, endLong) => {
    localStorage.setItem('uberjwt', 'aA-_gAKRRkPR_7fIhmMU-3IQGKVAYkMKCrMGq5A1')
    await fetch(`https://cors-anywhere.herokuapp.com/${uberUrl}v1.2/estimates/price?start_latitude=${startLat}&start_longitude=${startLong}&end_latitude=${endLat}&end_longitude=${endLong}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token " + localStorage.uberjwt
      },
    })
      .then(response => response.json())
      .then(prices => {
        let avgPrice = (((prices.prices[0].low_estimate) + (prices.prices[0].high_estimate)) / 2).toFixed(2)
        this.setState({
          uberPrice: Number(avgPrice)
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  fetchUberTime = async (startLat, startLong, endLat, endLong) => {
    localStorage.setItem('uberjwt', 'aA-_gAKRRkPR_7fIhmMU-3IQGKVAYkMKCrMGq5A1')
    await fetch(`https://cors-anywhere.herokuapp.com/${uberUrl}v1.2/estimates/time?start_latitude=${startLat}&start_longitude=${startLong}&end_latitude=${endLat}&end_longitude=${endLong}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token " + localStorage.uberjwt
      },
    })
      .then(response => response.json())
      .then(times => {
        let timeMin = times.times[0].estimate / 60
        this.setState({
          uberTime: Number(timeMin)
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  fetchHiddenLyftData = async () => {
    await fetch(`${lyftURL}oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic VFlndXhSdTlvWTdVOmpyLVRfYm9vOFJobFNtek1VZlhndkN0bDN5SnRnWWNB"
      },
      body: JSON.stringify({
        "grant_type": "client_credentials",
        "scope": "public"
      }),
    })
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('lyftjwt', data.access_token)
      })
      .catch(error => {
        console.error(error)
      })
  }

  getLyftCost = async (startLat, startLong, endLat, endLong) => {
    await fetch(`https://cors-anywhere.herokuapp.com/${lyftURL}v1/cost?start_lat=${startLat}&start_lng=${startLong}&end_lat=${endLat}&end_lng=${endLong}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.lyftjwt
      }
    })
      .then(response => response.json())
      .then(data => {
        let avgCost = (((data.cost_estimates[0].estimated_cost_cents_max + data.cost_estimates[0].estimated_cost_cents_min) / 2) / 100).toFixed(2)
        this.setState({
          lyftCost: Number(avgCost)
        })
        console.log(typeof this.state.lyftCost)
      })
      .catch(error => {
        console.error(error)
      })
  }

  getLyftETA = async (startLat, startLong) => {
    await fetch(`https://cors-anywhere.herokuapp.com/${lyftURL}v1/eta?lat=${startLat}&lng=${startLong}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.lyftjwt
      }
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          lyftETA: (data.eta_estimates[0].eta_seconds / 60).toFixed(0)
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  async componentDidMount() {
    await this.fetchHiddenLyftData()
      .catch(err => console.error(err))
  }

  searchPrices = async (e) => {
    e.preventDefault()
    this.setState({
      fetchingEstimates: true,
      uberPrice: null,
      uberTime: null,
      lyftCost: null,
      lyftETA: null
    })
    const fromAddress = e.target[0].value
    const toAddress = e.target[1].value
    await fetch(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?address=${fromAddress}&key=AIzaSyBixPOjrGSjxpkw-pszxd_iUvQdbMBTXxg`, {
      method: "GET",
      "Content-Type": "application/json",
    })
      .then(response => response.json())
      .then(data => {
        this.setState({ pickupLatLong: data.results[0].geometry.location })
      })
      .catch(error => {
        console.error(error)
      })
    await fetch(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?address=${toAddress}&key=AIzaSyBixPOjrGSjxpkw-pszxd_iUvQdbMBTXxg`, {
      method: "GET",
      "Content-Type": "application/json",
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          dropoffLatLong: data.results[0].geometry.location
        })
      })
      .then(() => this.fetchUberPrice(this.state.pickupLatLong.lat, this.state.pickupLatLong.lng, this.state.dropoffLatLong.lat, this.state.dropoffLatLong.lng))
      .then(() => this.fetchUberTime(this.state.pickupLatLong.lat, this.state.pickupLatLong.lng))
      .then(() => this.getLyftCost(this.state.pickupLatLong.lat, this.state.pickupLatLong.lng, this.state.dropoffLatLong.lat, this.state.dropoffLatLong.lng))
      .then(() => this.getLyftETA(this.state.pickupLatLong.lat, this.state.pickupLatLong.lng))
      .then(() => this.postLyftDatabase())
      .then(() => this.postUberDatabase())
      .catch(error => {
        console.error(error)
      })
  }

  postLyftDatabase = async () => {
    const lyftData = {
      eta_of_pickup: Number(this.state.lyftETA),
      estimated_price: Number(this.state.lyftCost)
    }
    console.log(lyftData)
    await fetch(`${url}lyftRide/`, {
      method: 'POST',
      body: JSON.stringify(lyftData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
      .then(data => data.json())
      .then(lyft => {
        // console.log(lyft)
        this.setState({
          lyftData: lyft[0]
        })
      })
  }


  postUberDatabase = async () => {
    const uberData = {
      eta_of_pickup: Number(this.state.uberTime),
      estimated_price: Number(this.state.uberPrice)
    }
    console.log(uberData)
    await fetch(`${url}uberRide/`, {
      method: 'POST',
      body: JSON.stringify(uberData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
      .then(data => data.json())
      .then(uber => {
        // console.log(uber)
        this.setState({
          uberData: uber[0]
        })
      })
  }

  selectedLyftRide = (e) => {
    e.preventDefault()
    this.postSelectedLyftRide()
    this.setState({
      orderedLyft: true
    })
  }

  selectedUberRide = (e) => {
    e.preventDefault()
    this.postSelectedUberRide()
    this.setState({
      orderedUber: true
    })
  }

  postSelectedLyftRide = () => {
    const rideData = {
      lyft_id: this.state.lyftData.id,
      eta_of_pickup: Number(this.state.lyftData.eta_of_pickup),
      estimated_price: Number(this.state.lyftData.estimated_price)
    }
    fetch(`${url}ride/`, {
      method: 'POST',
      body: JSON.stringify(rideData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
  }

  postSelectedUberRide = () => {
    const rideData = {
      uber_id: this.state.uberData.id,
      eta_of_pickup: Number(this.state.uberData.eta_of_pickup),
      estimated_price: Number(this.state.uberData.estimated_price)
    }
    fetch(`${url}ride/`, {
      method: 'POST',
      body: JSON.stringify(rideData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
  }


  pickUpAddress = async (e) => {
    this.setState({ puAddress: e.target.value })
    await fetch(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${e.target.value}&key=AIzaSyBixPOjrGSjxpkw-pszxd_iUvQdbMBTXxg&sessiontoken=${localStorage.lyftjwt}`, {
      method: "GET",
      "Content-Type": "application/json",
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          autocompletePu: data
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  dropOffAddress = async (e) => {
    this.setState({ doAddress: e.target.value })
    await fetch(`https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${e.target.value}&key=AIzaSyBixPOjrGSjxpkw-pszxd_iUvQdbMBTXxg&sessiontoken=${localStorage.lyftjwt}`, {
      method: "GET",
      "Content-Type": "application/json",
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          autocompleteDo: data
        })
      })
      .catch(error => {
        console.error(error)
      })
  }

  addressClick = (description) => {
    this.setState({
      puAddress: description,
      autocompletePu: ''
    })
  }

  clickDoAddress = (description) => {
    this.setState({
      doAddress: description,
      autocompleteDo: ''
    })
  }

  render() {
    return (
      <div>
        <Logo />
        <Form
          puAddress={this.state.puAddress}
          doAddress={this.state.doAddress}
          searchPrices={this.searchPrices}
          pickUpAddress={this.pickUpAddress}
          dropOffAddress={this.dropOffAddress}
          autocompletePu={this.state.autocompletePu}
          autocompleteDo={this.state.autocompleteDo}
          addressClick={this.addressClick}
          clickDoAddress={this.clickDoAddress}
        />


        {this.state.lyftCost && this.state.uberPrice && this.state.uberTime && this.state.lyftETA
          ? <Comparison
            lyftCost={this.state.lyftCost}
            lyftETA={this.state.lyftETA}
            uberPrice={this.state.uberPrice}
            uberTime={this.state.uberTime}
            selectedLyftRide={this.selectedLyftRide}
            selectedUberRide={this.selectedUberRide}
            orderedLyft={this.state.orderedLyft}
            orderedUber={this.state.orderedUber}
          />
          : this.state.fetchingEstimates
            ? <Loader />
            : <div></div>}
      </div>
    );
  }
}

export default App;