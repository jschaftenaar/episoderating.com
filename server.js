const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const app = express();
const Tmdb = require('./tmdb');
const tmdb = new Tmdb(
  process.env.TMDB_API_KEY,
  process.env.TMDB_USERNAME,
  process.env.TMDB_PASSWORD
);

app.use(express.static(path.join(__dirname, 'build')));

app.get('/ping', function (req, res) {
 return res.send('pong');
});

app.get('/data/show/:id', async function (req, res) {
  const show = await tmdb.getShow(req.params.id);
  return res.send(show);
});

app.get('/data/favorite/shows', async function (req, res) {
  const shows = await tmdb.getFavoriteShows();
  return res.send(shows);
});

app.get('/data/shows/search', async function (req, res) {
  console.log(req.query.query);
  const shows = await tmdb.searchShows(req.query.query);
  return res.send(shows);
});

app.get('/data/shows', async function (req, res) {
  const shows = await tmdb.getShows();
  return res.send(shows);
});

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);
