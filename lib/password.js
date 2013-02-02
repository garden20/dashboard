/*!
 * password-generator
 * Copyright(c) 2011 Bermi Ferrer <bermi@bermilabs.com>
 * MIT Licensed
 */

var consonant, letter, password, vowel, exclude;
letter = /[a-zA-Z]$/;
exclude = /[\-_0O1lI]/;
vowel = /[aeiouAEIOU]$/;
consonant = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]$/;

module.exports = password = function(length, memorable, pattern, prefix) {
  var char, n;
  if (length == null) {
    length = 10;
  }
  if (memorable == null) {
    memorable = true;
  }
  if (pattern == null) {
    pattern = /\w/;
  }
  if (prefix == null) {
    prefix = '';
  }
  if (prefix.length >= length) {
    return prefix;
  }
  if (memorable) {
    if (prefix.match(consonant)) {
      pattern = vowel;
    } else {
      pattern = consonant;
    }
  }
  n = (Math.floor(Math.random() * 100) % 94) + 33;
  char = String.fromCharCode(n);
  if (memorable) {
    char = char.toLowerCase();
  }
  if (!char.match(pattern) || char.match(exclude)) {
    return password(length, memorable, pattern, prefix);
  }
  return password(length, memorable, pattern, "" + prefix + char);
};
/**
 * Version.
 */
exports.version = '0.1.2';
