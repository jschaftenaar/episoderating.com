import axios from 'axios';

export function getShows() {
    return axios.get('/data/shows');
}

export function getShow(id) {
    return axios.get(`/data/show/${id}`);
}

export function getFavoriteShows() {
    return axios.get(`/data/favorite/shows`);  
}

export function searchShows(query) {
  return axios.get('/data/shows/search', { params: { query }})
}
