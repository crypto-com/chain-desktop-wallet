import i18n from '../language/I18n';
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
        memo: doc.memo,
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
        memo: doc.memo,
      }));
    } catch (error) {
      // no-op
    }

    return contacts;
  }

  public async retrieveAddressBookContact(
    walletId: string,
    chainName: string,
    assetSymbol: string,
    address: string,
  ) {
    let contact: AddressBookContact | undefined;

    try {
      const c = await this.storageService.queryAddressBookContact(
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
          memo: c.memo,
        };
      }
    } catch (error) {
      // no-op
    }

    return contact;
  }

  public async autoAddAddressBookContact(
    walletId: string,
    chainName: string,
    assetSymbol: string,
    address: string,
    memo: string,
  ) {
    // check if exists
    const isExist = await this.retrieveAddressBookContact(
      walletId,
      chainName,
      assetSymbol,
      address,
    );

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

    const label = `${i18n.t('settings.addressBook.address')} ${count + 1}`;

    return await this.addAddressBookContact({
      walletId,
      chainName,
      assetSymbol,
      label,
      address,
      memo,
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
        memo: saved.memo,
      };
    } catch (error) {
      // no-op
    }

    return contact;
  }

  public async editAddressBookContact(
    _id: string,
    chainName: string,
    assetSymbol: string,
    label: string,
    address: string,
    memo: string,
  ) {
    let success = false;

    try {
      await this.storageService.updateAddressBookContact(
        _id,
        chainName,
        assetSymbol,
        label,
        address,
        memo,
      );
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
