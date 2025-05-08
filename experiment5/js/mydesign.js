// mydesign.js provided by Prof Modes

/* exported p4_inspirations, p4_initialize, p4_render, p4_mutate */


function getInspirations() {
    return [
      {
        name: "Throne and Liberty with my boyfriend", 
        assetUrl: "assets/TNL.png",
        credit: "Playing Throne and Liberty, taken by myself"
      },
      {
        name: "On gliders on Archeage with my boyfriend", 
        assetUrl: "assets/Archeage skyemp.png",
        credit: "Playing Archeage, taken by myself"
      },
      {
        name: "Playing Archeage with my boyfriend", 
        assetUrl: "assets/archeage2.png",
        credit: "Playing Archeage, taken by myself"
      },
      {
        name: "Playing Enshrouded with my boyfriend", 
        assetUrl: "assets/enshrouded.png",
        credit: "Playing Enshrouded, taken by myself"
      },
    ];
  }
  
  function initDesign(inspiration) {
    // set the canvas size based on the container
    let canvasContainer = $('.image-container'); // Select the container using jQuery
    let canvasWidth = canvasContainer.width(); // Get the width of the container
    let aspectRatio = inspiration.image.height / inspiration.image.width;
    let canvasHeight = canvasWidth * aspectRatio; // Calculate the height based on the aspect ratio
    resizeCanvas(canvasWidth, canvasHeight);
    $(".caption").text(inspiration.credit); // Set the caption text
  
    // add the original image to #original
    const imgHTML = `<img src="${inspiration.assetUrl}" style="width:${canvasWidth}px;">`
    $('#original').empty();
    $('#original').append(imgHTML);
  
    
    let design = {
      bg: 128,
      fg: [],
      circles: [],
      triangles: [],
    }
    
    for(let i = 0; i < 30; i++) {
      design.fg.push({x: random(width),
                      y: random(height),
                      w: random(width/2),
                      h: random(height/2),
                      fill: random(255)})
    }

    for (let i = 0; i < 30; i++) {
        design.circles.push({x:random(width),
            y: random(height),
            radius: random(5, width/5),
            fill: random(255),
            alpha: random(50, 200)
        });
    }

    for (let i = 0; i < 20; i++) {
        design.triangles.push({
          x1: random(width),
          y1: random(height),
          x2: random(width),
          y2: random(height),
          x3: random(width),
          y3: random(height),
          fill: random(255),
          alpha: random(50, 200)
        });
    }
    return design;
  }
  
  function renderDesign(design, inspiration) {
    background(design.bg);
    noStroke();
    for(let box of design.fg) {
      fill(box.fill, 128);
      rect(box.x, box.y, box.w, box.h);
    }

    for (let circle of design.circles) {
        fill(circle.fill, circle.alpha);
        ellipse(circle.x, circle.y, circle.radius*2);
    }

    for (let tri of design.triangles) {
        fill(tri.fill, tri.alpha);
        triangle(tri.x1, tri.y1, tri.x2, tri.y2, tri.x3, tri.y3);
    }
  }
  
  function mutateDesign(design, inspiration, rate) {
    design.bg = mut(design.bg, 0, 255, rate);
    for(let box of design.fg) {
      box.fill = mut(box.fill, 0, 255, rate);
      box.x = mut(box.x, 0, width, rate);
      box.y = mut(box.y, 0, height, rate);
      box.w = mut(box.w, 0, width/2, rate);
      box.h = mut(box.h, 0, height/2, rate);
    }

    for (let circle of design.circles) {
        circle.fill = mut(circle.fill, 0, 255, rate);
        circle.x = mut(circle.x, 0, width, rate);
        circle.y = mut(circle.y, 0, height, rate);
        circle.radius = mut(circle.radius, 0, width/5, rate);
        circle.alpha = mut(circle.alpha, 50, 200, rate);
    }

    for (let tri of design.triangles) {
        tri.fill = mut(tri.fill, 0, 255, rate);
        tri.x1 = mut(tri.x1, 0, width, rate);
        tri.y1 = mut(tri.y1, 0, height, rate);
        tri.x2 = mut(tri.x2, 0, width, rate);
        tri.y2 = mut(tri.y2, 0, height, rate);
        tri.x3 = mut(tri.x3, 0, width, rate);
        tri.y3 = mut(tri.y3, 0, height, rate);
        tri.alpha = mut(tri.alpha, 50, 200, rate);
    }
  }
  
  function mut(num, min, max, rate) {
      return constrain(randomGaussian(num, (rate * (max - min)) / 10), min, max);
  }