import Web3ReactManager from './components/web3/Web3RectManager';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import getLibrary from './utils/getLibrary'
import Web3NetworkProvider from './components/web3/Web3NetworkProvider';
import './App.css';
import Home from './page/home';
import LoadingBox from './components/loadingBox';

function App() {

  return (
    <div className="App">
      <div className='main'>
        <Web3ReactProvider getLibrary={getLibrary}>
          <Web3ReactManager>
            <Web3NetworkProvider>
              <HashRouter>
                <LoadingBox />
                <Routes >
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                </Routes>
              </HashRouter>
            </Web3NetworkProvider>
          </Web3ReactManager>
        </Web3ReactProvider>
      </div>
    </div>
  );
}

export default App;
