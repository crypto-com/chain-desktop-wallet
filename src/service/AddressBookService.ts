import { AddressBookContact, AddressBookContactModel } from '../models/AddressBook';
import { StorageService } from '../storage/StorageService';

export class AddressBookService {
  private readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  public async retrieveAllAddressBookContacts(walletId: string) {
    let contacts: AddressBookContact[] = [];

    try {
      const documents = await this.storageService.retrieveAllAddressBookContacts(walletId);
      contacts = documents.map(doc => ({
        /* eslint no-underscore-dangle: 0 */
        id: doc._id,
        chainName: doc.chainName,
        assetSymbol: doc.assetSymbol,
        label: doc.label,
        address: doc.address,
      }));
    } catch (error) {
      // no-op
    }

    return contacts;
  }

  public async retrieveAddressBookContacts(
    walletId: string,
    chainName: string,
    assetSymbol: string,
  ) {
    let contacts: AddressBookContact[] = [];

    try {
      const documents = await this.storageService.retrieveAddressBookContacts(
        walletId,
        chainName,
        assetSymbol,
      );
      contacts = documents.map(doc => ({
        /* eslint no-underscore-dangle: 0 */
        id: doc._id,
        chainName: doc.chainName,
        assetSymbol: doc.assetSymbol,
        label: doc.label,
        address: doc.address,
      }));
    } catch (error) {
      // no-op
    }

    return contacts;
  }

  public async retriveAddressBookContact(
    walletId: string,
    chainName: string,
    assetSymbol: string,
    address: string,
  ) {
    let contact: AddressBookContact | undefined;

    try {
      const c = await this.storageService.queryAddreeBookContact(
        walletId,
        chainName,
        assetSymbol,
        address,
      );
      if (c) {
        contact = {
          id: c._id,
          chainName: c.chainName,
          assetSymbol: c.assetSymbol,
          label: c.label,
          address: c.address,
        };
      }
    } catch (error) {
      // no-op
    }

    return contact;
  }

  public async autoAddAdressBookContact(
    walletId: string,
    chainName: string,
    assetSymbol: string,
    address: string,
  ) {
    // check if exists
    const isExist = await this.retriveAddressBookContact(walletId, chainName, assetSymbol, address);

    if (isExist) {
      return undefined;
    }

    // auto generate label
    let count = 0;
    try {
      count = await this.storageService.queryAddressBookContactCount(
        walletId,
        chainName,
        assetSymbol,
      );
    } catch (error) {
      // no-op
    }

    // TODO: i18n
    const label = `Address ${count + 1}`;

    return await this.addAddressBookContact({
      walletId,
      chainName,
      assetSymbol,
      label,
      address,
    });
  }

  public async addAddressBookContact(contactModel: AddressBookContactModel) {
    let contact: AddressBookContact | undefined;
    try {
      const saved = await this.storageService.insertAddressBookContact(contactModel);
      contact = {
        id: saved._id,
        chainName: saved.chainName,
        assetSymbol: saved.assetSymbol,
        label: saved.label,
        address: saved.address,
      };
    } catch (error) {
      // no-op
    }

    return contact;
  }

  public async editAddressBookContact(_id: string, label: string, address: string) {
    let success = false;

    try {
      await this.storageService.updateAddressBookContact(_id, label, address);
      success = true;
    } catch (error) {
      // no-op
    }

    return success;
  }

  public async removeAddressBookContact(_id: string) {
    let success = false;
    try {
      await this.storageService.removeAddressBookContact(_id);
      success = true;
    } catch (error) {
      // no-op
    }

    return success;
  }
}
