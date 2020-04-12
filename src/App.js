import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import './App.scss';
import Header from './Header';
import Shows from './Shows';
import About from './About';
import Show from './Show';
import Home from './Home';

export default function App() {
  return (
    <Router>
      <Header/>
      <Switch>
        <Route path="/about" component={About}/>
        <Route path="/show/:id" component={Show}/>
        <Route path="/shows" component={Shows}/>
        <Route path="/" component={Home}/>
      </Switch>
    </Router>
  );
}
