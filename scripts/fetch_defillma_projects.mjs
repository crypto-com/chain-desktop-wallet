import axios from 'axios'
import request from 'request';
import fs from 'fs';
import path from 'path';

const Config = {
  host: 'https://api.llama.fi',
};

function fetchProtocols()  {
  return new Promise((resolve, reject) => {
    const url = `${Config.host}/protocols`;
    axios
      .get(url)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });
}

function downloadImage(uri, filename) {
  // console.log(uri, filename);
  return new Promise((resolve, reject) => {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', resolve());
  })
};

const protocols = (await fetchProtocols()).filter(p => {
  return p.chains.includes('Cronos')
})

const projects = []

const categoriesMapping = {
  'Dexes': 'DEX',
  'Lending': 'Lending',
  'Yield': 'Yield',
  'Algo-Stables': 'Stablecoin',
  'Reserve Currency': 'Reserve Currency',
  'Staking': 'Staking'
}

fs.mkdirSync('scripts/logo')

for (const protocol of protocols) {

  const fileName = protocol.logo.split('/').slice(-1)[0];

  await downloadImage(protocol.logo, path.join('scripts/logo', fileName))

  projects.push({
    name: protocol.name,
    category: [categoriesMapping[protocol.category]],
    description: protocol.description,
    logo: fileName,
    link: protocol.url,
    twitter: `https://twitter.com/${protocol.twitter}`,
  })
}


// console.log(projects);
fs.writeFileSync(path.join('scripts', 'projects.json') ,JSON.stringify(projects));