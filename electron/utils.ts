export function isValidURL(str: string) {
    const regex = new RegExp(
      '^(http[s]?:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?', // lgtm [js/redos]
    );
  
    const withoutPrefixRegex = new RegExp(
      '^([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?', // lgtm [js/redos]
    );
    return regex.test(str) || withoutPrefixRegex.test(str);
}
  