const https = require('https');
const apiKey = process.env.FMP_API_KEY;
const symbols = [
  ['SPX', '%5EGSPC'],
  ['DJI', '%5EDJI'],
  ['IXIC', '%5EIXIC'],
  ['RUT', '%5ERUT'],
  ['VIX', '%5EVIX']
];

function fetchIndex(name, sym) {
  return new Promise((resolve, reject) => {
    const url = 'https://financialmodelingprep.com/stable/quote?symbol=' + sym + '&apikey=' + apiKey;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ name, data: parsed[0] || parsed });
        } catch(e) {
          resolve({ name, error: data.substring(0, 200) });
        }
      });
    }).on('error', (e) => resolve({ name, error: e.message }));
  });
}

(async () => {
  const results = [];
  for (const [name, sym] of symbols) {
    const result = await fetchIndex(name, sym);
    results.push(result);
  }
  console.log(JSON.stringify(results, null, 2));
})();
