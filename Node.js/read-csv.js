const csv = require('csv-parser');
const fs = require('fs');
const results = [];
const headerToPrint = 'Preguntas';
let index = 0;
// const readStream = 
fs.createReadStream('preguntas_ordenadas.csv')
    .pipe(csv({mapHeaders: ({ header }) => header.trim()}))
    .on('data', (data) => { //This push goes through the entire .csv file and gather all the info in it
      if (index === 2) { //this check for and especific index and push the data of that row into the results array
        // const headerContent = data[headerToPrint];
        const headerContent = data[headerToPrint];
        results.push(data);
        //console.log(`${headerToPrint}: ${headerContent}`); //The `` (Left side of 1) are to represent literal, the variable is enclosed in ${}
      }
      index++;
    })
    .on('end', () => {
      // Process the parsed data here      
      for (const data of results) {  // creates a new constant variable `data` that represents each element (object) in the `results` array.
        const headerContent = data[headerToPrint]; //assigns the value of the specific header (headerToPrint) in the current data object to the headerContent variable. 
        console.log(`${headerToPrint}: ${headerContent}`); 
      }
      console.log(results)
      console.log('Finished processing the CSV file.');
    });

