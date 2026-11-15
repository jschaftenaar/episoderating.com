import { NavLink } from "react-router-dom";
import { SourceSwitcher } from "./SourceSwitcher";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="brand">
          Episode<span>Rating</span>
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/shows">Shows</NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <SourceSwitcher />
      </div>
    </header>
  );
}
