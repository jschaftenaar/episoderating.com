const axios = require('axios');
const qs = require('qs');
const cache = require('./cache');

class Tmdb {

  constructor(apikey, username, password) {
    this.apikey = apikey;
    this.username = username,
    this.password = password,
    this.endpoint = 'https://api.themoviedb.org/3';
    this.cache = new cache();
  }

  authenticatedRequest(url, override = {}) {
    const options = {
      method: 'GET',
      url: `${this.endpoint}${url}`,
      params: {},
      ...override
    };
    options.params.api_key = this.apikey;
    try {
      return axios(options);
    }  
    catch (error) {
      console.error(error);
    }
  }

  async getShows() {
    const key = 'shows';
    const data = await this.cache.get(key);
    if (data) {
      return data;
    }    
    const shows = await this.authenticatedRequest('/tv/on_the_air');
    this.cache.set(key, shows.data.results);
    return shows.data.results;
  }

  async searchShows(query) {
    const key = `search_shows_${query}`;
    const data = await this.cache.get(key);
    if (data) {
      return data;
    }    
    const shows = await this.authenticatedRequest('/search/tv', {params: { query }});
    this.cache.set(key, shows.data.results);
    return shows.data.results;
  }

  async getShow(id) {
    const key = `show_${id}`;
    const data = await this.cache.get(key);
    if (data) {
      return data;
    }
    const request = await this.authenticatedRequest(`/tv/${id}`);  
    const show = request.data;
    show.seasons = show.seasons.filter((season) => {
      if (season.season_number) {
        return season;
      };
    });
    for (let i=0; i < show.seasons.length; i++) {
      const episodes = await this.getSeason(id, show.seasons[i].season_number);
      show.seasons[i].episodes = episodes.data.episodes;
    }

    this.cache.set(key, show);
    return show;
  }

  getSeason(id, nr) {
    return this.authenticatedRequest(`/tv/${id}/season/${nr}`);
  }

  async getFavoriteShows() {
    const key = 'favorite_shows';
    const data = await this.cache.get(key);
    if (data) {
      return data;
    }
    const token = await this.authenticatedRequest(`/authentication/token/new`);
    const request_token = token.data.request_token;
    const token2 = await this.authenticatedRequest('/authentication/token/validate_with_login', {
      method: 'post',
      data: {
        request_token,
        username: this.username,
        password: this.password
      }
    });
    const session = await this.authenticatedRequest('/authentication/session/new', {
      params: {
        'request_token': token2.data.request_token
      }
    });
    const account = await this.authenticatedRequest(`/account`, {
      params: {
        'session_id': session.data.session_id
      }
    });
    const favorites = await this.authenticatedRequest(`/account/${account.data.id}/favorite/tv`, {
      params: {
        'session_id': session.data.session_id
      }
    });
    this.cache.set(key, favorites.data.results);
    return favorites.data.results;
  }
}

module.exports = Tmdb;
