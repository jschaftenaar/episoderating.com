import React from "react";

export default function About() {
  return (
    <div>
      <div className="container">
        <h1 className="mt-5">About EpisodeRating.com</h1>
        <p className="lead">This site is created as a hobby project just for fun. Buy me a coffee, lunch or anything really <a href="https://www.buymeacoffee.com/jschaftenaar">https://www.buymeacoffee.com/jschaftenaar</a> or paypal a million dollars or any amount at <a href="http://paypal.me/jschaftenaar/1000000">paypal.me/jschaftenaar</a></p>
        <p>As data source I am using <a href="https://www.themoviedb.org/">https://www.themoviedb.org/</a></p>
        <p>You can probably find the source code for this thing on <a href="https://github.com/jschaftenaar/episoderating.com">github</a></p>
      </div>
      <div className="container">
        <h6>Future plan/todo list</h6>
        <ul className="list-group">
          <li className="list-group-item">Cleanup code</li>
          <li className="list-group-item">Get rid of bootstrap</li>
          <li className="list-group-item">Add more data sources like imdb</li>
          <li className="list-group-item">Improve filtering</li>
          <li className="list-group-item">Add proper unit tests</li>
        </ul>      
      </div>
    </div>
  );
}
