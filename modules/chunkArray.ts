const chunkArray = <T>(myArray: T[], chunk_size: number): T[][] => {
  const arrayLength = myArray.length;
  const tempArray: T[][] = [];

  for (let i = 0; i < arrayLength; i += chunk_size) {
    const myChunk = myArray.slice(i, i + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}

export default chunkArray