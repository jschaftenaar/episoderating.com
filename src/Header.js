import React from "react";
import { Link, Route } from "react-router-dom";

export default function Header() {
  const navbarBrandClick = (event) => {
    event.preventDefault();
  }

function ListItemLink({ to, children }) {
  return (
    <Route
      path={to}
      children={({ match }) => (
        <li className={match ? "nav-item is-active" : "nav-item"}>
          <Link to={to} className="nav-link">{children}</Link>
        </li>
      )}
    />
  );
}

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand" href="/" onClick={navbarBrandClick}>Episode Rating . com</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExample07" aria-controls="navbarsExample07" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarsExample07">
          <ul className="navbar-nav mr-auto">
            <ListItemLink to="/">Home</ListItemLink>
            <ListItemLink to="/shows">Shows</ListItemLink>
            <ListItemLink to="/about">About</ListItemLink>
          </ul>
        </div>
      </div>
    </nav>
  );
}
