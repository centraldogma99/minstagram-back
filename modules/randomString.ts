function randomString(length: number, charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  const charactersLength = charSet.length;
  for (let i = 0; i < length; i++) {
    result += charSet.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default randomString;