import React from 'react';
import logo from './assets/logo.svg';

import './sass/App.scss';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to the desktop app
        </p>
      </header>
    </div>
  );
}

export default App;
