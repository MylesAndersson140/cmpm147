// project.js - purpose and description here
// Author: Your Name
// Date:

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
class MyProjectClass {
  // constructor function
  constructor(param1, param2) {
    // set properties using 'this' keyword
    this.property1 = param1;
    this.property2 = param2;
  }
  
  // define a method
  myMethod() {
    // code to run when method is called
  }
}

function main() {
  const fillers = {
    direction: ["right", "left", "diagonal", "top"],
    animal: ["Medusa", "Giraffe", "Gorgon", "Kitty", "Worm", "Bulbasaur"],
    number: ["2", "3", "4","5", "6", "10", "30"],
    body: ["chocolate", "wood", "clocks", "seatbelts", "metal", "fur", "snakes", "alphabet soup", "glass"],
    sleeptime: ["nocturnal", "diurnal", "crepuscular", "matutinal", "vespertine"],
    diet: ["meat", "grass and vegetables", "air", "water", "gas", "both meat and vegetables", "paper"],
    yesorno: ["not", ""],
    material: ["dirt", "coins", "mud", "sand", "soup", "food", "a nice warm blanket", "clouds", "ice", "snow"],
    
  };
  
  const template = `And on the $direction, we have our $animal exibit!
  
  As you can see it has $number eyes, $number legs, and $number arms! Also you'll note that the body of this animal is made up purely of $body, what an interesting sight to behold!
  
  Some interesting facts about it is that it is $sleeptime, prefers $diet for nutrients, $yesorno able to swim, and lastly it loves to burrow into $material when tired!
  `;
  
  
  // STUDENTS: You don't need to edit code below this line.
  
  const slotPattern = /\$(\w+)/;
  
  function replacer(match, name) {
    let options = fillers[name];
    if (options) {
      return options[Math.floor(Math.random() * options.length)];
    } else {
      return `<UNKNOWN:${name}>`;
    }
  }
  
  function generate() {
    let story = template;
    while (story.match(slotPattern)) {
      story = story.replace(slotPattern, replacer);
    }
  
    /* global box */
    $("#box").text(story);
  }
  
  /* global clicker */
  $("#clicker").click(generate);
  
  generate();
  
}

// let's get this party started - uncomment me
main();