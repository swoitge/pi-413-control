function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function executeTimed(times, worker) {
  var currentIndex = 0;
  var executionTimes = 0;
  var start = new Date().getTime();
  console.log("start execution");

  var offset = 0;

  function next(){

    // end condition
    if(currentIndex > times.length-1) {

      // calculate some statistics
      var avgTime = (executionTimes / times.length).toPrecision(3);

      console.log("no more executions");
      console.log("-- average execution time :", avgTime);
      return;
    }
    setTimeout(function(){
      const startWorker = new Date().getTime();
      worker(currentIndex);
      offset = new Date().getTime() - startWorker;
      executionTimes += offset;
      console.log("worker", currentIndex, "took", offset, "ms");
      currentIndex++;
      next();
    }, times[currentIndex]-offset);
  }

  // initial
  next();
}

var worker = function(index){
  console.log("execute worker", index);
  sleep(200);
}

//executeTimed([0, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500], worker);
