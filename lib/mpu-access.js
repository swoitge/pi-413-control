
var readByte = function(i2cInst, adr, reg) {
  return i2cInst.readByteSync(adr, reg);
}

var readWord = function(i2cInst, adr, reg) {
  return i2cInst.readWordSync(adr, reg);
}

var setBit = function(i2cInst, adr, reg, bit) {

}

module.exports = {readByte, readWord, setBit};
