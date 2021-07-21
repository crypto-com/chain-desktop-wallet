# Instructions on Language Management
All the language contents are managed inside the Google Spreadsheet [`Desktop Wallet Language`](https://docs.google.com/spreadsheets/d/1QTqPb97jr6zOD7krA4pAXHYx51CiSkJYq7m71OYcLok/edit#gid=0), with an Apps Script [`csvToJson.gs`](https://script.google.com/home/projects/1X1WCMV0tbQsXvlkV70Kw_3gvF85zSxeqkUnTuDhul_EcdWG9ZU4_Z6ow/edit) for exporting the Multi-Language content as JSON. 

If you need the access, please contact: [matthew.to@crypto.com](mailto:matthew.to@crypto.com) or [eddy.wanny@crypto.com](mailto:eddy.wanny@crypto.com)

## Content Update Guidelines & Procedure
Always add the `en-US` content first and then the others, as by default the `en-US` translation will be displayed if there are any missing contents yet to be translated.

### Adding a new language
Insert a new column with a proper Language Code following [ISO 639-1 & ISO 3166-2 Language Localisation Standard](http://www.lingoes.net/en/translator/langcode.htm).

### Adding new contents
Insert a new row with a variable name properly describing the nature of the content. 
e.g. `send.formSend.recipientAddress.label`
In `Send Page` => Component `FormSend` => Field `recipientAddress` => Label

### Procedure
Whenever you've modified any contents inside the [Spreadsheet](https://docs.google.com/spreadsheets/d/1QTqPb97jr6zOD7krA4pAXHYx51CiSkJYq7m71OYcLok/edit#gid=0), you will need to do the following steps properly in order to take effective:
1. Choose `Desktop Wallet` Tab
2. In the Navbar Menu, choose `Export JSON` => `Export JSON for this sheet`
3. The script will generate the JSON. Wait until it's finished.
4. Copy the generated JSON and paste it inside `translations.json`