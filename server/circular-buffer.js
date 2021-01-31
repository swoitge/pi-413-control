// Circular buffer storage. Externally-apparent 'length' increases indefinitely
// while any items with indexes below length-n will be forgotten (undefined
// will be returned if you try to get them, trying to set is an exception).
// n represents the initial length of the array, not a maximum
function CircularBuffer(n) {
    this._array = new Array(n);
    this.position = 0;
}

CircularBuffer.prototype.toString= function() {
    return '[object CircularBuffer('+this._array.length+') length '+this.length+']' + this._array.join(",");
};

CircularBuffer.prototype.put= function(value) {

  this._array[this.position] = value;
  this.position ++;
  if(this.position  >= this._array.length) {
    this.position = 0;
  }
};

CircularBuffer.prototype.getAvg = function() {
  var sum = 0;
  this._array.forEach(function(e){sum += e;});
  return sum / this._array.length;
};

function test() {

  var cb = new CircularBuffer(10);
  cb.put(10);
  cb.put(9);
  cb.put(8);
  cb.put(7);
  cb.put(6);
  cb.put(5);
  cb.put(4);
  cb.put(3);
  cb.put(2);
  cb.put(1);

  console.log("array  ", cb.toString());
  console.log("average", cb.getAvg());

  cb.put(0);
  cb.put(0);
  console.log("array  ", cb.toString());
  console.log("average", cb.getAvg());

  cb.put(0);
  cb.put(0);
  console.log("array  ", cb.toString());
  console.log("average", cb.getAvg());

  cb.put(10);
  console.log("array  ", cb.toString());
  console.log("average", cb.getAvg());
}
