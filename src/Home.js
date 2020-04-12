import React from "react";
import { getFavoriteShows } from './data';
import { Link } from "react-router-dom";
import './home.scss';
import Cards from './Cards';

class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {favorites: []};
    document.body.style.backgroundImage = ``;
    getFavoriteShows()
      .then((result) => {
        this.setState({favorites:result.data})
      });
  }

  render() {
    return (
      <div className="container">
        <div className="jumbotron">
          <h1 className="display-4">Episoderating.com</h1>
          <p className="lead">This is a hobby project.</p>
          <hr className="my-4"/>
          <p>Checkout the <Link to="/about">about page</Link>. Go to the <Link to="/shows">Shows page</Link> to find all available shows. Below you can find a small selection of some of my favorites.</p>
        </div>
        <h6>Favorites</h6>
        <div className="row">
          <Cards shows={this.state.favorites}/>
        </div>
      </div>
    );
  }
}

export default Home;
