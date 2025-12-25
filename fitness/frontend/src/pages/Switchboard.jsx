import React from 'react';
import { Link } from 'react-router-dom';

export default function Switchboard() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Switchboard</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/content/games">Games</Link></li>
        <li><Link to="/content/stories">Stories</Link></li>
        <li><Link to="/content/images">Images</Link></li>
        <li><Link to="/content/videos">Videos</Link></li>
      </ul>
    </div>
  );
}
