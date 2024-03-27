import { bech32ToEVMAddress } from './utils';

describe('Testing Common utils functions', () => {
  it('Test decoding Bech32 address ', () => {
    const decoded = bech32ToEVMAddress('tcrc1k43xa93pquw4sa3y4h7kznvxlt5weyrykxxmwu');
    expect(decoded).toBe('0xB5626E9621071D587624AdFD614D86fAe8ec9064');
    expect(decoded).not.toBe('0xc1626E9621071D587624AdFD614D86fAe8ec9064');

    const decoded1 = bech32ToEVMAddress('tcrc1llf6qppvwhw6t4q702nzpm9ewq3h75f6kzv0hn');
    expect(decoded1).toBe('0xffd3a0042C75DDa5d41e7aa620ecB970237F513a');
  });
});