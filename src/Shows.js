import React from "react";
import { getShows, searchShows } from './data';
import './shows.scss';
import Cards from './Cards';

class Shows extends React.Component {

  constructor(props) {
    super(props);
    this.updateSearch = this.updateSearch.bind(this);
    this.search = this.search.bind(this);
    this.state = {shows: [], search: ''};
    getShows()
      .then((result) => {
        this.setState({shows:result.data})
      });
  }

  search(event) {
    event.preventDefault();
    searchShows(this.state.search)
      .then((result) => {
        this.setState({shows:result.data})
      });
  }

  updateSearch(event) {
    this.setState({search: event.target.value})
  }

  render() {
    return (
      <div className="container">
        <div className="row">      
          <div className="filter col-3">
            <h6>Filter</h6>
            <form onSubmit={this.search}>
              <div className="form-group">
                <label htmlFor="search">Title</label>
                <input type="text" className="form-control" id="search" aria-describedby="searchHelp" onChange={this.updateSearch} value={this.state.search}/>
                <small id="searchHelp" className="form-text text-muted">Search for a tv show. Input it's title and click Search</small>
              </div>
              <button type="submit" className="btn btn-primary">Search</button>
            </form>            
          </div>
          <div className="container col-9">
            <h6>Shows</h6>
            <div className="row">
              <Cards shows={this.state.shows}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Shows;