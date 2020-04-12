import React from "react";
import './cards.scss';
import { Link } from "react-router-dom";

class Cards extends React.Component {

  render() {
    const shows = this.props.shows.map((show) => {
      return (
          <div className="col-3 card-wrapper" key={show.id}>
            <div className="card ">
              <Link to={`/show/${show.id}`}>
                <img src={`https://image.tmdb.org/t/p/w220_and_h330_face/${show.poster_path}`} className="card-img-top" alt="..."/>
              <div className="card-body">
                <p className="card-text">{show.name}</p>
              </div>
        </Link>
  
            </div>
          </div>
      );
    });
    return shows;
  }
}

export default Cards;