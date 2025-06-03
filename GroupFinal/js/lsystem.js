let lineLength = 75;
let theta = 10;

let ls;
let ls2;
let ls3;

class LSystem 
{
		constructor()
		{
				this.steps = 0;
			
				// input
				this.axiom = "F";
			
				// rules for replacing characters
				//this.ruleF = "F[+F][-F]";
				this.ruleF = "F[++FC][--FC]";
				//this.ruleF = "F[+F--F]";
				//this.ruleF = "F[+F-F]"
				//this.ruleF = "F[C]-F"
			
				this.ruleC = "C";
			
				this.rulePlus = "+";
			
				this.ruleMinus = "-";
			
				this.rulePush = "[";
			
				this.rulePop = "]";
			
				this.reset();
		}
	
		simulate(gen)
		{
				while (this.getAge() < gen)
				{
						this.iterate();		
				}
		}
	
		reset()
		{
				this.production = this.axiom;
				this.generations = 0;
		}
	
		getAge()
		{	
				return this.generations;
		}
	
		iterate()
		{
				let newProduction = "";
				
				for (let i = 0; i < this.production.length; i++)
				{
						let step = this.production.charAt(i);
					
						switch (step)
						{
								case 'F':
										newProduction = newProduction + this.ruleF;
										break;		
								
								case 'C':
										newProduction = newProduction + this.ruleC;
										break;
								
								case '-':
										newProduction = newProduction + this.ruleMinus;
										break;
								
								case '+':
										newProduction = newProduction + this.rulePlus;
										break;
								
								case '[':
										newProduction = newProduction + this.rulePush;
										break;
								
								case ']':
										newProduction = newProduction + this.rulePop;
										break;
								
								default:
										print("Error in iterate: switch statement default case");
										break;
						}	
				}
			
				this.generations++;
				this.production = newProduction;
		}
	
		render()
		{
				for (let i = 0; i < this.production.length; i++)
				{
						let step = this.production.charAt(i);		
						
						let val = i * 255/this.production.length;
						stroke(val, val, val);
						fill(0, 255 - val, 0);
					
						switch (step)
						{
								case 'F':
										line(0, 0, 0, -lineLength);
										translate(0, -lineLength);
										break;
								
								case 'C':
										noStroke();
										circle(0, 0, 30);
										break;
								
								case '-':
										rotate(-theta);
										break;
								
								case '+':
										rotate(theta);
										break;
								
								case '[':
										push();
										break;
								
								case ']':
										pop();
										break;
								
								default:
										print("Error in render: switch statement default case");
										break;
						}
				}
		}
}

// function setup()
// {
// 		createCanvas(windowWidth, windowHeight);
// 		background(220);
// 		strokeWeight(3);
	
// 		angleMode(DEGREES);
	
// 		ls = new LSystem();
// 		ls2 = new LSystem();
// 		ls3 = new LSystem();
	
// 		ls.simulate(6);
	
// 		lineLength = lineLength/2;
	
// 		ls2.simulate(4);
	
// 		lineLength = lineLength/2;
	
// 		ls3.simulate(2);
// }

// function draw()
// {
// 		background(220);
// 		theta = 30 * mouseY/360;
// 		lineLength = 50 + mouseX/10;
	
// 		push();
// 		translate(width/2, height);
// 		ls.render();
// 		pop();
	
// 		push();
// 		translate(width/4, height);
// 		ls2.render();
// 		pop();
	
// 		push();
// 		translate(width/2 + width/4, height);
// 		ls2.render();
// 		pop();
	
// 		push();
// 		translate(width/8, height);
// 		ls3.render();
// 		pop();
	
// 		push();
// 		translate(width/2 + width/4 + width/8, height);
// 		ls3.render();
// 		pop();
// }