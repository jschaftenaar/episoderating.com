import React from "react";
import { getShow } from './data';
import { maxEpisodes, ratingClass } from './helper';
import './show.scss';

class Show extends React.Component {

  constructor(props) {
    super(props);
    const id = props.match.params.id;
    this.state = { id }
    getShow(id)
      .then((result) => {
        document.body.style.backgroundImage = `url(https://image.tmdb.org/t/p/original/${result.data.backdrop_path})`;
        this.setState({ show:result.data })
      });
  }

  componentWillUnmount() {
    document.body.style.backgroundImage = '';    
  }

  render() {
    const show = this.state.show;
    if (!show) {
      return (
        <div className="container">
          <h5>Loading...</h5>
        </div>
      );
    } else {
      const createRow = (seasons, item) => {
        const cells = seasons.map((season, index) => {
          const key = `s${item}_${index}`;
          if (season.episodes[item] && season.episodes[item].vote_average ) {
            const rating = season.episodes[item].vote_average.toFixed(1);
            const rclass = ratingClass(rating);
            return (
              <td key={key} className={rclass}>
                <div className="background"></div>
                <div className="text">
                  { season.episodes[item].vote_average.toFixed(1) }
                </div>
              </td>
            );
          } else {
            return (
              <td key={key}></td>
            )
          }
        })
        return (
          <tr key={`s${item}`}>
            <td className="table-header-cell">{item+1}</td>
            {cells}
          </tr>
        )
      }

      const rows = [];
      for (let i = 0; i<maxEpisodes(show.seasons); i++) {
        rows.push(createRow(show.seasons, i));
      }

      const head = show.seasons.map((season, index) => {
           return (
            <th className="table-header-cell" key={`season${index}`}>{index+1}</th>
          );
      })

      return (
        <div className="container">
          <div className="row">      
            <div className="container">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="table-header-cell" colSpan={show.seasons.length+1}><h1>{show.name}</h1></th>
                    </tr>
                    <tr>
                      <th className="table-header-cell"></th>
                      {head}
                    </tr>
                  </thead>
                  <tbody>
                    {rows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Show;
