import { AddressBookContact, AddressBookContactModel } from '../models/AddressBook';
import { StorageService } from '../storage/StorageService';

export class AddressBookService {
  private readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  // eslint-disable
  public async retrieveAddressBookContacts(walletId: string, asset: string) {
    let contacts: AddressBookContact[] = [];

    try {
      const documents = await this.storageService.retrieveAddressBookContacts(walletId, asset);
      contacts = documents.map(doc => ({
        /* eslint no-underscore-dangle: 0 */
        id: doc._id,
        label: doc.label,
        address: doc.address,
      }));
    } catch (error) {
      // no-op
    }

    return contacts;
  }

  public async isAddressBookContactExisit(walletId: string, asset: string, address: string) {
    let isExist = false;

    try {
      const contact = await this.storageService.queryAddreeBookContact(walletId, asset, address);
      if (contact) {
        isExist = true;
      }
    } catch (error) {
      // no-op
    }

    return isExist;
  }

  public async addAddressBookContact(contactModel: AddressBookContactModel) {
    let contact: AddressBookContact | undefined;
    try {
      const saved = await this.storageService.insertAddressBookContact(contactModel);
      contact = {
        id: saved._id,
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
